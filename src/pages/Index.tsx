import { useState } from "react";
import { ModeSelector } from "@/components/ModeSelector";
import { PracticeTest } from "@/components/PracticeTest";
import { RandomPractice } from "@/components/RandomPractice";

type Mode = 'select' | 'practice-test' | 'random-practice';

const Index = () => {
  const [mode, setMode] = useState<Mode>('select');

  const handleSelectMode = (selectedMode: 'practice-test' | 'random-practice') => {
    setMode(selectedMode);
  };

  const handleBack = () => {
    setMode('select');
  };

  if (mode === 'practice-test') {
    return <PracticeTest onBack={handleBack} />;
  }

  if (mode === 'random-practice') {
    return <RandomPractice onBack={handleBack} />;
  }

  return <ModeSelector onSelectMode={handleSelectMode} />;
};

export default Index;
