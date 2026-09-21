import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAdminTopics } from "@/hooks/useTopics";
import { useAddLessonTopic, useRemoveLessonTopic, useUpdateLessonTopicOrder } from "@/hooks/useLessons";
import type { LessonTopic } from "@/types/lessons";
import { AddTopicDialog } from "./lessons/AddTopicDialog";
import { SortableTopicItem } from "./lessons/SortableTopicItem";

interface LessonTopicManagerProps {
  lessonId: string;
  topics: LessonTopic[];
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

  // Follow the server, except while a reorder is in flight: the optimistic
  // order stays until the write settles, then a refetch confirms it.
  useEffect(() => {
    if (!updateOrder.isPending) setOrderedTopics(topics);
  }, [topics, updateOrder.isPending]);

  const inLesson = new Set(orderedTopics.map((lt) => lt.topic_id));
  const needle = searchTerm.toLowerCase();
  const availableTopics = allTopics.filter(
    (t) => !inLesson.has(t.id) && (t.title.toLowerCase().includes(needle) || t.description?.toLowerCase().includes(needle))
  );

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTopics.findIndex((t) => t.id === active.id);
    const newIndex = orderedTopics.findIndex((t) => t.id === over.id);
    const newOrder = arrayMove(orderedTopics, oldIndex, newIndex);
    setOrderedTopics(newOrder);

    updateOrder.mutate(
      newOrder.map((lt, idx) => ({ id: lt.id, display_order: idx })),
      {
        onSuccess: () => toast.success("Order updated"),
        onError: () => {
          setOrderedTopics(topics);
          toast.error("Failed to update order");
        },
      }
    );
  };

  const handleAddTopic = (topicId: string) => {
    addLessonTopic.mutate(
      { lessonId, topicId, displayOrder: orderedTopics.length },
      {
        onSuccess: () => {
          toast.success("Topic added to lesson");
          setIsAddDialogOpen(false);
          setSearchTerm("");
        },
        onError: (error) => toast.error("Failed to add topic: " + error.message),
      }
    );
  };

  const handleRemoveTopic = (lessonTopicId: string) => {
    setRemovingId(lessonTopicId);
    removeLessonTopic.mutate(lessonTopicId, {
      onSuccess: () => toast.success("Topic removed from lesson"),
      onError: (error) => toast.error("Failed to remove topic: " + error.message),
      onSettled: () => setRemovingId(null),
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography component="h3" sx={{ fontWeight: 500 }}>
          Topics in this Lesson ({orderedTopics.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => setIsAddDialogOpen(true)}
          startIcon={<Box component={Plus} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
        >
          Add Topic
        </Button>
      </Box>

      {orderedTopics.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedTopics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <List disablePadding aria-label="Topics in order" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {orderedTopics.map((lt, index) => (
                <SortableTopicItem
                  key={lt.id}
                  lessonTopic={lt}
                  index={index}
                  onRemove={() => handleRemoveTopic(lt.id)}
                  isRemoving={removingId === lt.id}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      ) : (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary", border: "1px dashed", borderColor: "divider", borderRadius: "8px" }}>
          <Typography>No topics added yet.</Typography>
          <Typography sx={{ fontSize: "0.875rem", mt: 0.5 }}>Click "Add Topic" to add topics to this lesson.</Typography>
        </Box>
      )}

      <AddTopicDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        topics={availableTopics}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onPick={handleAddTopic}
        isAdding={addLessonTopic.isPending}
      />
    </Box>
  );
}
