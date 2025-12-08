import { useMemo } from "react";
import { Question, LinkData } from "@/hooks/useQuestions";
import { LinkPreview } from "@/components/LinkPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Play, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TopicLandingProps {
  subelement: string;
  subelementName: string;
  questions: Question[];
  onBack: () => void;
  onStartPractice: () => void;
}

// Topic descriptions for each subelement
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  T0: "Understanding FCC rules and regulations is fundamental to becoming a licensed amateur radio operator. This section covers the Commission's rules regarding station identification, authorized frequencies, power limits, and proper operating procedures. You'll learn about license classes, examination requirements, and the responsibilities that come with your amateur radio privileges.",
  
  T1: "Operating procedures form the backbone of effective amateur radio communication. This topic covers standard practices for making contacts, handling emergency communications, and participating in nets. You'll learn about phonetic alphabets, Q signals, procedural signals, and the etiquette that makes amateur radio a welcoming community for all operators.",
  
  T2: "Radio waves are the foundation of all wireless communication. This section explores how radio signals behave, including concepts like frequency, wavelength, and the electromagnetic spectrum. Understanding these characteristics helps you choose the right frequency and mode for your communication needs and troubleshoot signal problems.",
  
  T3: "Propagation determines how far and how reliably your signal travels. This topic covers the various ways radio waves travel from transmitter to receiver, including ground wave, sky wave, and line-of-sight propagation. You'll learn about the ionosphere, skip zones, and how solar activity affects long-distance communication.",
  
  T4: "Good amateur radio practices ensure safe, effective, and courteous operation. This section covers topics like RF safety, grounding, interference prevention, and station setup. You'll learn best practices for antenna installation, power management, and maintaining good relations with neighbors and other operators.",
  
  T5: "Electrical principles are essential for understanding how radio equipment works. This topic covers fundamental concepts like Ohm's Law, power calculations, and basic circuit theory. You'll learn about voltage, current, resistance, and how these relate to the operation of your radio equipment.",
  
  T6: "Electronic components are the building blocks of all radio equipment. This section introduces resistors, capacitors, inductors, diodes, transistors, and integrated circuits. Understanding these components helps you read schematics, troubleshoot equipment, and build your own projects.",
  
  T7: "Station equipment knowledge helps you select, operate, and maintain your radio gear. This topic covers transceivers, antennas, feed lines, and accessories. You'll learn about receiver and transmitter specifications, antenna tuners, SWR meters, and how to set up an effective amateur radio station.",
  
  T8: "Operating activities showcase the diverse world of amateur radio. This section covers various modes and activities including voice, digital modes, satellite communication, and emergency operations. You'll learn about contests, public service events, and the many ways to enjoy amateur radio.",
  
  T9: "Antennas and feed lines are critical to your station's performance. This topic covers antenna types, feed line characteristics, and matching systems. You'll learn about dipoles, verticals, beam antennas, coaxial cable, and how to optimize your antenna system for best performance.",
};

export function TopicLanding({ 
  subelement, 
  subelementName, 
  questions, 
  onBack, 
  onStartPractice 
}: TopicLandingProps) {
  // Get deduplicated links from all questions in this topic
  const topicLinks = useMemo(() => {
    const linkMap = new Map<string, LinkData>();
    
    questions.forEach(q => {
      if (q.links && q.links.length > 0) {
        q.links.forEach(link => {
          // Deduplicate by URL
          if (!linkMap.has(link.url)) {
            linkMap.set(link.url, link);
          }
        });
      }
    });
    
    return Array.from(linkMap.values());
  }, [questions]);

  const description = TOPIC_DESCRIPTIONS[subelement] || 
    `This topic covers important concepts related to ${subelementName.toLowerCase()}. Study the questions and resources below to strengthen your understanding of this subject area.`;

  // Group links by type
  const videoLinks = topicLinks.filter(l => l.type === 'video');
  const articleLinks = topicLinks.filter(l => l.type === 'article');
  const websiteLinks = topicLinks.filter(l => l.type === 'website');

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            All Topics
          </Button>
        </div>

        {/* Topic Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold text-2xl text-primary">
              {subelement}
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-foreground">
                {subelementName}
              </h1>
              <p className="text-muted-foreground">
                {questions.length} questions
              </p>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            About This Topic
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Start Practice Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Button 
            onClick={onStartPractice} 
            size="lg" 
            className="w-full gap-2 h-14 text-lg"
          >
            <Play className="w-5 h-5" />
            Start Practicing
          </Button>
        </motion.div>

        {/* Learning Resources */}
        {topicLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Learning Resources
              </h2>
              <span className="text-sm text-muted-foreground">
                {topicLinks.length} resource{topicLinks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Videos */}
            {videoLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Videos ({videoLinks.length})
                </h3>
                <div className="space-y-3">
                  {videoLinks.map((link, index) => (
                    <LinkPreview key={`video-${index}`} link={link} />
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {articleLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Articles ({articleLinks.length})
                </h3>
                <div className="space-y-3">
                  {articleLinks.map((link, index) => (
                    <LinkPreview key={`article-${index}`} link={link} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Websites */}
            {websiteLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Other Resources ({websiteLinks.length})
                </h3>
                <div className="space-y-3">
                  {websiteLinks.map((link, index) => (
                    <LinkPreview key={`website-${index}`} link={link} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* No resources message */}
        {topicLinks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-secondary/50 border border-border rounded-xl p-6 text-center"
          >
            <ExternalLink className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No additional learning resources have been added for this topic yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Start practicing to see resources linked to individual questions.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
