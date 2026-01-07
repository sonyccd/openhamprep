import { useState } from "react";
import { useAdminTopics } from "@/hooks/useTopics";
import { useAddLessonTopic, useRemoveLessonTopic, useUpdateLessonTopicOrder } from "@/hooks/useLessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Trash2, GripVertical, Loader2 } from "lucide-react";
import { LessonTopic } from "@/types/lessons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface LessonTopicManagerProps {
  lessonId: string;
  topics: LessonTopic[];
}

interface SortableTopicItemProps {
  lessonTopic: LessonTopic;
  index: number;
  onRemove: () => void;
  isRemoving: boolean;
}

function SortableTopicItem({ lessonTopic, index, onRemove, isRemoving }: SortableTopicItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lessonTopic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border border-border rounded-lg",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-muted-foreground w-6">
        {index + 1}.
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {lessonTopic.topic?.title || "Unknown Topic"}
        </p>
        {lessonTopic.topic?.description && (
          <p className="text-sm text-muted-foreground truncate">
            {lessonTopic.topic.description}
          </p>
        )}
      </div>
      {!lessonTopic.topic?.is_published && (
        <Badge variant="outline" className="text-warning border-warning/50">
          Draft
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={isRemoving}
        className="text-muted-foreground hover:text-destructive"
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

export function LessonTopicManager({ lessonId, topics }: LessonTopicManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderedTopics, setOrderedTopics] = useState(topics);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: allTopics = [] } = useAdminTopics();
  const addLessonTopic = useAddLessonTopic();
  const removeLessonTopic = useRemoveLessonTopic();
  const updateOrder = useUpdateLessonTopicOrder();

  // Keep local state in sync with props
  if (JSON.stringify(topics) !== JSON.stringify(orderedTopics) && !updateOrder.isPending) {
    setOrderedTopics(topics);
  }

  // Get available topics (not already in lesson)
  const availableTopics = allTopics.filter(
    (t) => !orderedTopics.some((lt) => lt.topic_id === t.id)
  );

  // Filter available topics by search
  const filteredAvailableTopics = availableTopics.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedTopics.findIndex((t) => t.id === active.id);
      const newIndex = orderedTopics.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(orderedTopics, oldIndex, newIndex);
      setOrderedTopics(newOrder);

      // Update display_order in database
      const updates = newOrder.map((lt, idx) => ({
        id: lt.id,
        display_order: idx,
      }));

      updateOrder.mutate(updates, {
        onError: () => {
          // Revert on error
          setOrderedTopics(topics);
          toast.error("Failed to update order");
        },
      });
    }
  };

  const handleAddTopic = async (topicId: string) => {
    const nextOrder = orderedTopics.length;
    addLessonTopic.mutate(
      { lessonId, topicId, displayOrder: nextOrder },
      {
        onSuccess: () => {
          toast.success("Topic added to lesson");
          setIsAddDialogOpen(false);
          setSearchTerm("");
        },
        onError: (error) => {
          toast.error("Failed to add topic: " + error.message);
        },
      }
    );
  };

  const handleRemoveTopic = async (lessonTopicId: string) => {
    setRemovingId(lessonTopicId);
    removeLessonTopic.mutate(lessonTopicId, {
      onSuccess: () => {
        toast.success("Topic removed from lesson");
        setRemovingId(null);
      },
      onError: (error) => {
        toast.error("Failed to remove topic: " + error.message);
        setRemovingId(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          Topics in this Lesson ({orderedTopics.length})
        </h3>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      {/* Topic List with Drag & Drop */}
      {orderedTopics.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedTopics.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {orderedTopics.map((lt, index) => (
                <SortableTopicItem
                  key={lt.id}
                  lessonTopic={lt}
                  index={index}
                  onRemove={() => handleRemoveTopic(lt.id)}
                  isRemoving={removingId === lt.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <p>No topics added yet.</p>
          <p className="text-sm mt-1">Click "Add Topic" to add topics to this lesson.</p>
        </div>
      )}

      {/* Add Topic Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Topic to Lesson</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 py-2">
            {filteredAvailableTopics.length > 0 ? (
              filteredAvailableTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleAddTopic(topic.id)}
                  disabled={addLessonTopic.isPending}
                  className="w-full flex items-center gap-3 p-3 text-left bg-card hover:bg-secondary border border-border rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {topic.title}
                    </p>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  {!topic.is_published && (
                    <Badge variant="outline" className="text-warning border-warning/50 shrink-0">
                      Draft
                    </Badge>
                  )}
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <p>No topics match "{searchTerm}"</p>
                ) : (
                  <p>All topics have been added to this lesson.</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
