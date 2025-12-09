import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, ArrowRight, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
  category: "licensing" | "app" | "study";
}

const faqs: FAQItem[] = [
  // Licensing Questions
  {
    category: "licensing",
    question: "What is amateur (ham) radio?",
    answer: "Amateur radio, also known as ham radio, is a popular hobby and service that allows licensed operators to communicate with other operators around the world using radio frequencies. It's used for recreation, emergency communications, contests, experimentation, and public service."
  },
  {
    category: "licensing",
    question: "Why do I need a license to operate?",
    answer: "The Federal Communications Commission (FCC) requires all amateur radio operators in the United States to hold a valid license. This ensures operators understand radio regulations, proper operating procedures, and basic electronics to prevent interference with other radio services."
  },
  {
    category: "licensing",
    question: "What are the different license classes?",
    answer: "There are three license classes: Technician (entry-level, grants VHF/UHF privileges and limited HF), General (intermediate, grants most HF privileges), and Amateur Extra (highest class, grants all amateur privileges). Each class requires passing an exam, and you must hold the previous class to upgrade (except Technician, which is the starting point)."
  },
  {
    category: "licensing",
    question: "How much does the license exam cost?",
    answer: "The exam session fee varies by Volunteer Examiner Coordinator (VEC) but typically ranges from $0 to $15. Additionally, the FCC charges a $35 application fee for new licenses and upgrades. Some VECs waive session fees for youth or offer free exams."
  },
  {
    category: "licensing",
    question: "How do I find an exam session near me?",
    answer: "Visit the ARRL exam finder at arrl.org/find-an-amateur-radio-license-exam-session or contact your local amateur radio club. Many clubs, including RARS, regularly host exam sessions. Online remote exams are also available through various VECs."
  },
  {
    category: "licensing",
    question: "What's on the Technician exam?",
    answer: "The Technician exam has 35 multiple-choice questions covering FCC rules, operating procedures, radio wave characteristics, antenna basics, electrical principles, and safety. You need 26 correct answers (74%) to pass. All questions come from the official FCC question pool."
  },
  {
    category: "licensing",
    question: "How long is a ham radio license valid?",
    answer: "Amateur radio licenses are valid for 10 years. You can renew your license online through the FCC's Universal Licensing System (ULS) within 90 days before expiration or up to 2 years after expiration (with a grace period). There's no exam required for renewal."
  },
  {
    category: "licensing",
    question: "Can I upgrade my license class?",
    answer: "Yes! You can upgrade from Technician to General, and from General to Amateur Extra. Each upgrade requires passing the exam for that class. You can even take multiple exams in one session—if you pass Technician, you can immediately attempt General, and if you pass that, you can attempt Extra."
  },
  
  // App Questions
  {
    category: "app",
    question: "Is RARS Test Prep really free?",
    answer: "Yes, completely free with no hidden costs, subscriptions, or premium features locked behind a paywall. This app was built by volunteers from the Raleigh Amateur Radio Society to help people get licensed."
  },
  {
    category: "app",
    question: "Do I need to create an account?",
    answer: "Yes, a free account is required to track your progress, save bookmarks, and review your test history. Your data is stored securely and never shared with third parties."
  },
  {
    category: "app",
    question: "Does the app work offline?",
    answer: "The app requires an internet connection to sync your progress and load questions. However, once a page is loaded, you can continue studying that session even with intermittent connectivity."
  },
  {
    category: "app",
    question: "Can I use this app on my phone?",
    answer: "Absolutely! RARS Test Prep is fully responsive and works great on phones, tablets, and computers. You can study anywhere, anytime."
  },
  {
    category: "app",
    question: "Are the questions the actual exam questions?",
    answer: "Yes! We use the official FCC question pools, which are the exact questions used on the real exam. The FCC publishes these pools publicly, and all exam questions come directly from them."
  },
  {
    category: "app",
    question: "How often are questions updated?",
    answer: "We update our question pools whenever the FCC releases new versions. Question pools are typically updated on a 4-year cycle. We'll notify users when new pools are available."
  },
  
  // Study Tips
  {
    category: "study",
    question: "How long does it take to prepare for the Technician exam?",
    answer: "Most people can prepare in 1-4 weeks with regular study. If you study 30-60 minutes daily, you should be ready within 2-3 weeks. Some people with technical backgrounds pass after just a few days of intensive study."
  },
  {
    category: "study",
    question: "What's the best way to study?",
    answer: "We recommend a combination approach: Start with practice tests to assess your baseline, then use random practice to drill through questions. Focus extra time on weak areas the app identifies. Before your exam, take several full practice tests and aim for consistent 85%+ scores."
  },
  {
    category: "study",
    question: "What score should I aim for before taking the real exam?",
    answer: "While 74% is passing, we recommend consistently scoring 85% or higher on practice tests before scheduling your real exam. This buffer accounts for test anxiety and ensures you're truly prepared."
  },
  {
    category: "study",
    question: "Should I memorize answers or understand concepts?",
    answer: "Both! While memorizing answers can help you pass, understanding the underlying concepts makes you a better operator and helps with upgrades. Our explanations are designed to help you understand why answers are correct, not just which answer to pick."
  },
  {
    category: "study",
    question: "How do I handle questions I keep getting wrong?",
    answer: "Use the Weak Questions Review feature to focus specifically on questions you've missed. Bookmark particularly tricky questions and add notes to help you remember. Reading the explanation after each wrong answer helps reinforce the correct information."
  },
  {
    category: "study",
    question: "Is there a time limit on the real exam?",
    answer: "There's no official FCC time limit, but most Volunteer Examiners expect completion within about 2 hours. In practice, most people finish the 35-question Technician exam in 20-45 minutes. Our practice tests include an optional timer if you want to practice with time pressure."
  },
];

const categories = [
  { id: "licensing", label: "Ham Radio Licensing" },
  { id: "app", label: "About the App" },
  { id: "study", label: "Study Tips" },
] as const;

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left bg-card hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-foreground pr-4">{item.question}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="p-4 md:p-5 pt-0 md:pt-0 text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]["id"]>("licensing");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const filteredFaqs = faqs.filter(faq => faq.category === activeCategory);

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Reset open items when category changes
  const handleCategoryChange = (category: typeof activeCategory) => {
    setActiveCategory(category);
    setOpenItems(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 px-4 radio-wave-bg">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-mono font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about ham radio licensing and using RARS Test Prep.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap gap-2 mb-8 justify-center"
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {category.label}
                </button>
              ))}
            </motion.div>

            {/* FAQ Items */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={`${activeCategory}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <FAQAccordion
                    item={faq}
                    isOpen={openItems.has(index)}
                    onToggle={() => toggleItem(index)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Still Have Questions Section */}
        <section className="py-16 px-4 bg-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? The RARS community is here to help.
              Visit our website or join a club meeting to connect with experienced hams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.rars.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Visit RARS.org
                </Button>
              </a>
              <Link to="/auth">
                <Button size="lg" className="group">
                  Start Studying
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 md:p-12">
              <Radio className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-4">
                Ready to Get Your License?
              </h2>
              <p className="text-muted-foreground mb-6">
                Start studying today with our free practice tests and study tools.
              </p>
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 group">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground space-y-3">
          <p className="text-sm">Official FCC question pools • Free to use</p>
          <p className="text-sm">
            A test prep app for the{" "}
            <a
              href="https://www.rars.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Raleigh Amateur Radio Society (RARS)
            </a>
          </p>
          <p className="text-sm">Made with ❤️ in North Carolina</p>
          <p className="text-xs mt-4">© {new Date().getFullYear()} Brad Bazemore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
