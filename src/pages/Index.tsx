import { useState } from "react";
import { LicenseSelector } from "@/components/LicenseSelector";
import { ModeSelector } from "@/components/ModeSelector";
import { PracticeTest } from "@/components/PracticeTest";
import { RandomPractice } from "@/components/RandomPractice";

type View = 'license-select' | 'mode-select' | 'practice-test' | 'random-practice';

const Index = () => {
  const [view, setView] = useState<View>('license-select');

  const handleSelectLicense = () => {
    setView('mode-select');
  };

  const handleSelectMode = (selectedMode: 'practice-test' | 'random-practice') => {
    setView(selectedMode);
  };

  const handleBackToMode = () => {
    setView('mode-select');
  };

  const handleBackToLicense = () => {
    setView('license-select');
  };

  if (view === 'practice-test') {
    return <PracticeTest onBack={handleBackToMode} />;
  }

  if (view === 'random-practice') {
    return <RandomPractice onBack={handleBackToMode} />;
  }

  if (view === 'mode-select') {
    return <ModeSelector onSelectMode={handleSelectMode} onBack={handleBackToLicense} />;
  }

  return <LicenseSelector onSelectLicense={handleSelectLicense} />;
};

export default Index;
