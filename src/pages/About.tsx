import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, Users, Heart, Code, ExternalLink, ArrowRight, BookOpen, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 radio-wave-bg">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Radio className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse-slow" />
              <h1 className="text-4xl md:text-5xl font-mono font-bold text-foreground mb-6">
                About RARS Test Prep
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A free, modern study tool built by amateur radio enthusiasts for aspiring hams.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="text-3xl font-mono font-bold text-foreground mb-4">
                  Our Mission
                </h2>
                <p className="text-muted-foreground mb-4">
                  We believe getting your amateur radio license should be accessible to everyone. 
                  That's why we created a completely free, no-strings-attached study platform.
                </p>
                <p className="text-muted-foreground mb-4">
                  RARS Test Prep was built by members of the{" "}
                  <a
                    href="https://www.rars.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Raleigh Amateur Radio Society
                  </a>{" "}
                  to help our community—and the wider ham radio community—prepare for 
                  FCC license exams.
                </p>
                <p className="text-muted-foreground">
                  Whether you're studying for your Technician, General, or Amateur Extra 
                  license, we've got you covered with the complete official question pools 
                  and smart study tools.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">1,700+</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Target className="w-8 h-8 text-success mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <div className="text-sm text-muted-foreground">License Classes</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground">Free Forever</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">RARS</div>
                  <div className="text-sm text-muted-foreground">Community</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About RARS Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-mono font-bold text-foreground">
                  About RARS
                </h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                <p className="text-muted-foreground mb-4">
                  The <strong className="text-foreground">Raleigh Amateur Radio Society (RARS)</strong> is 
                  a nonprofit organization serving amateur radio operators in the Raleigh, North Carolina 
                  area and beyond. Founded to promote amateur radio, we provide education, community, 
                  and support for hams of all experience levels.
                </p>
                <p className="text-muted-foreground mb-6">
                  RARS hosts regular meetings, license exam sessions, and community events. We're 
                  passionate about growing the amateur radio community and helping new hams get started 
                  in this rewarding hobby.
                </p>
                <a
                  href="https://www.rars.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  Visit RARS.org
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Code className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-mono font-bold text-foreground">
                  Built With Modern Tech
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                RARS Test Prep is built with modern web technologies to provide a fast, 
                reliable, and accessible study experience on any device.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "React & TypeScript",
                  "Tailwind CSS",
                  "Supabase Backend",
                  "Progressive Web App",
                  "Mobile Responsive",
                  "Dark Mode Support",
                ].map((tech) => (
                  <div
                    key={tech}
                    className="bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-8 h-8 text-destructive" />
                <h2 className="text-3xl font-mono font-bold text-foreground">
                  Made With Love
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                This project is developed and maintained by volunteers from the RARS community. 
                We're committed to keeping it free and continuously improving it based on 
                user feedback.
              </p>
              <p className="text-muted-foreground">
                Have a feature request or found a bug? Use the help button in the app to 
                submit feedback, or reach out to us through the{" "}
                <a
                  href="https://www.rars.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  RARS website
                </a>
                .
              </p>
            </motion.div>
          </div>
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
                Ready to Start Studying?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join the RARS community and begin your journey to becoming a licensed amateur radio operator.
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
          <p className="text-xs mt-4">© {new Date().getFullYear()} Brad Bazemore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
