import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Radio, 
  Users, 
  Heart, 
  Code, 
  ExternalLink, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  BookOpen,
  Unlock,
  MessageCircle,
  Zap,
  GitBranch,
  Shield,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";
import { cn } from "@/lib/utils";

export default function About() {
  const values = [
    {
      icon: Unlock,
      title: "Open Access",
      description: "No paywalls, no premium tiers, no hidden costs. Quality education should be available to everyone.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Heart,
      title: "Built With Passion",
      description: "Created by amateur radio enthusiasts who remember the excitement of their first QSO.",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: Users,
      title: "Community First",
      description: "We're not building a product—we're growing a community of operators who help each other.",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: GitBranch,
      title: "Open Source",
      description: "Transparent, auditable, and community-driven. Contribute, fork, or learn from the code.",
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  const principles = [
    {
      icon: Target,
      title: "More Than a Ticket",
      description: "We don't just help you pass an exam—we help you understand the material so you can truly enjoy the hobby.",
    },
    {
      icon: Sparkles,
      title: "Learn by Understanding",
      description: "Every explanation is written to help you grasp concepts, not just memorize answers.",
    },
    {
      icon: MessageCircle,
      title: "Ready for the Air",
      description: "When you pass using RARS Test Prep, you'll be confident making your first contact.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 px-4 radio-wave-bg relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-3 mb-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Radio className="w-16 h-16 text-primary" />
                </motion.div>
              </div>
              <h1 className="text-4xl md:text-6xl font-mono font-bold text-foreground mb-6 leading-tight">
                By Hams.{" "}
                <span className="text-primary text-glow-primary">For Hams.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We believe everyone deserves access to amateur radio. That's why we built a 
                free, open-source study platform—to open the door for the next generation of operators.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary/20 rounded-full hidden md:block" />
              <div className="md:pl-8">
                <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-6">
                  Our Mission
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Amateur radio has always been about <strong className="text-foreground">open access</strong>—anyone 
                    with a license and a radio can communicate around the world. But too often, the path to 
                    getting licensed feels closed off: expensive study materials, outdated resources, or 
                    platforms that prioritize profit over education.
                  </p>
                  <p>
                    We started RARS Test Prep with a simple belief: <strong className="text-foreground">if you want 
                    to become a ham, nothing should stand in your way</strong>. Not money. Not access. Not geography.
                  </p>
                  <p>
                    This isn't just about passing an exam. It's about preparing you to{" "}
                    <strong className="text-foreground">love this hobby</strong>—to feel the thrill of your first 
                    contact, to understand why radio propagation is magical, and to join a global community of 
                    makers, experimenters, and communicators.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Grid */}
        <section className="py-16 md:py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">
                What We Stand For
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These aren't just words—they're the principles that guide every decision we make.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", value.bg)}>
                      <value.icon className={cn("w-6 h-6", value.color)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* More Than a Ticket Section */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Our Philosophy
              </div>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">
                More Than Just Passing the Test
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                In ham radio, we say "get your ticket"—but a license is just the beginning of the journey.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {principles.map((principle, index) => (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <principle.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{principle.title}</h3>
                  <p className="text-muted-foreground text-sm">{principle.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="py-16 md:py-20 px-4 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Code className="w-8 h-8 text-success" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-4">
                      Open Source, Open Future
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        RARS Test Prep is <strong className="text-foreground">100% open source</strong>. 
                        Our code is public, our development is transparent, and our community is welcome to 
                        contribute. This isn't just about building software—it's about building trust.
                      </p>
                      <p>
                        When you use open-source software, you know exactly what you're getting. No hidden 
                        tracking, no surprise monetization, no rug pulls. Just honest tools built by people 
                        who care about the same things you do.
                      </p>
                      <p className="text-foreground font-medium">
                        Want to contribute? Found a bug? Have an idea? We'd love to hear from you.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                        <Shield className="w-4 h-4 text-success" />
                        No Tracking
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                        <Globe className="w-4 h-4 text-primary" />
                        Free Forever
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                        <GitBranch className="w-4 h-4 text-accent" />
                        Community Driven
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About RARS Section */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                  <Users className="w-4 h-4" />
                  The Team
                </div>
                <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">
                  Raleigh Amateur Radio Society
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    This project was born in the{" "}
                    <a
                      href="https://www.rars.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Raleigh Amateur Radio Society (RARS)
                    </a>
                    —a nonprofit club dedicated to promoting amateur radio in North Carolina and beyond.
                  </p>
                  <p>
                    We host license exam sessions, mentor new operators, and build tools like this one to 
                    make ham radio accessible to everyone. Whether you're in Raleigh or around the world, 
                    we're here to help you get on the air.
                  </p>
                </div>
                <a
                  href="https://www.rars.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium mt-4"
                >
                  Visit RARS.org
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">1,700+</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <Target className="w-8 h-8 text-success mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <div className="text-sm text-muted-foreground">License Classes</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground">Free Forever</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <Heart className="w-8 h-8 text-destructive mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">∞</div>
                  <div className="text-sm text-muted-foreground">Passion</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Inspiring Quote Section */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl text-primary/20 font-serif">"</div>
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed pt-8">
                The amateur radio community has always been about{" "}
                <span className="text-primary">elmering</span>—experienced operators helping newcomers 
                find their way. This app is our way of elmering at scale.
              </blockquote>
              <p className="text-muted-foreground mt-6 text-sm">
                "Elmer" is ham radio slang for a mentor who helps new operators learn the hobby.
              </p>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Radio className="w-14 h-14 text-primary mx-auto mb-6" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-4">
                  Your Journey Starts Here
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Join thousands of aspiring hams who've used RARS Test Prep to earn their licenses. 
                  The airwaves are waiting for you.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-10 py-6 group">
                    Start Studying Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground space-y-3">
          <p className="text-sm">Official FCC question pools • Free to use • Open Source</p>
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
          <p className="text-xs mt-4">© {new Date().getFullYear()} Brad Bazemore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
