import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Sparkles,
  Target,
  Layers,
  Clock,
  CheckCircle2,
  BarChart,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Globe,
      title: "ANALIZA STRONY",
      desc: "AI skanuje i rozumie Twoją stronę, identyfikując kluczowe elementy i USP",
      features: ["Analiza treści", "Wykrywanie CTA", "Optymalizacja SEO"],
      color: "from-blue-500/20 to-blue-600/10",
    },
    {
      icon: Layers,
      title: "MULTI-CHANNEL",
      desc: "Automatyczne kampanie na wszystkich głównych platformach",
      features: ["Google Ads", "Meta Ads", "LinkedIn"],
      color: "from-purple-500/20 to-purple-600/10",
    },
    {
      icon: TrendingUp,
      title: "OPTYMALIZACJA",
      desc: "Machine learning dostosowuje strategię w czasie rzeczywistym",
      features: ["A/B testing", "Bid management", "Audience targeting"],
      color: "from-green-500/20 to-green-600/10",
    },
  ];

  const chartData = [
    { day: 'Pon', value: 40, conversions: 245 },
    { day: 'Wto', value: 65, conversions: 398 },
    { day: 'Śro', value: 55, conversions: 332 },
    { day: 'Czw', value: 75, conversions: 456 },
    { day: 'Pią', value: 85, conversions: 512 },
    { day: 'Sob', value: 95, conversions: 578 },
    { day: 'Nie', value: 88, conversions: 526 }
  ];

  // Typ dla danych wykresu
  interface ChartDataPoint {
    day: string;
    value: number;
    conversions: number;
  }

  // Interfejs dla CustomTooltip
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: ChartDataPoint;
    }>;
    label?: string;
  }

  // Poprawiona funkcja CustomTooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">
            Konwersje: {payload[0].payload.conversions}
          </p>
          <p className="text-sm text-muted-foreground">
            Skuteczność: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter">
            WISEADS<span className="text-primary">.</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Button variant="ghost" className="text-sm font-medium">
              Funkcje
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Proces
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Cennik
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/login")}
            >
              Rozpocznij <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor .25px, transparent 1px),
                              linear-gradient(to bottom, currentColor .25px, transparent 1px)`,
            backgroundSize: "4rem 4rem",
          }}
        />
        <div className="container mx-auto px-6 z-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-8" variant="secondary">
                <Sparkles className="mr-2 h-3 w-3" />
                Powered by AI
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-8">
                AUTOMATYCZNE
                <br />
                <span className="text-primary">KAMPANIE</span>
                <br />
                MARKETINGOWE
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-xl">
                Wprowadź adres URL, a nasza platforma automatycznie przygotuje,
                uruchomi i będzie monitorować Twoją kampanię marketingową.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Input
                  type="url"
                  placeholder="https://twoja-strona.pl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-14 px-5 text-base"
                />
                <Button size="lg" className="h-14 px-8 font-bold text-base">
                  Analizuj stronę <ArrowRight className="ml-2" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>RODO Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>3 min setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>97% skuteczność</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl rounded-3xl"
                style={{ transform: `translateY(${scrollY * 0.1}px)` }}
              />
              <Card className="relative border shadow-2xl">
                <CardContent className="p-0">
                  {/* Dashboard Header */}
                  <div className="border-b px-6 py-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        dashboard.wiseads.pl
                      </span>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-8">
                    <h3 className="text-lg font-semibold mb-6">
                      Przegląd kampanii
                    </h3>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          2,847
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Konwersje
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          +34%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          ROI
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">89k</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Wyświetlenia
                        </p>
                      </div>
                    </div>

                    {/* Chart - Recharts */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground">
                        Skuteczność kampanii (%)
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsBarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={{ fill: 'transparent' }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="hsl(var(--primary))"
                            radius={[8, 8, 0, 0]}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Active Campaigns */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">
                            Google Ads
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Aktywna
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Meta Ads</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Aktywna
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-6" variant="outline">
              <Sparkles className="mr-2 h-3 w-3" />
              AI-Powered Solutions
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              ARCHITEKTURA <span className="text-primary">SUKCESU</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trzy filary, które napędzają Twój sukces marketingowy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-30`}
                />
                <CardContent className="relative p-8">
                  <feature.icon className="w-12 h-12 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.desc}</p>
                  <div className="space-y-3">
                    {feature.features.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-20">
              PROCES <span className="text-primary">KREACJI</span>
            </h2>

            <div className="space-y-16">
              {[
                {
                  num: "01",
                  title: "WPROWADŹ URL",
                  desc: "Podaj adres swojej strony internetowej. Nasza AI przeanalizuje całą zawartość.",
                },
                {
                  num: "02",
                  title: "ANALIZA AI",
                  desc: "Sztuczna inteligencja skanuje treść, identyfikuje USP i określa grupę docelową.",
                },
                {
                  num: "03",
                  title: "GENEROWANIE",
                  desc: "Automatyczne tworzenie kampanii na Google Ads, Meta i LinkedIn.",
                },
                {
                  num: "04",
                  title: "MONITORING",
                  desc: "Śledzenie wyników i optymalizacja w czasie rzeczywistym dla maksymalnego ROI.",
                },
              ].map((step, index) => (
                <div key={index} className="flex gap-8 items-start">
                  <div className="text-6xl font-black text-muted-foreground/20 w-24 flex-shrink-0">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-lg text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                value: "97%",
                label: "SKUTECZNOŚĆ KAMPANII",
                desc: "Średnia skuteczność naszych kampanii",
              },
              {
                icon: Clock,
                value: "24/7",
                label: "MONITORING REAL-TIME",
                desc: "Nieprzerwane śledzenie i optymalizacja",
              },
              {
                icon: Zap,
                value: "3MIN",
                label: "CZAS DO STARTU",
                desc: "Od URL do działającej kampanii",
              },
            ].map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-sm">
                <CardContent className="p-8">
                  <stat.icon className="w-10 h-10 text-primary mx-auto mb-6" />
                  <div className="text-4xl font-black text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider mb-2">
                    {stat.label}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <Card className="max-w-4xl mx-auto shadow-xl">
            <CardContent className="p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                ZACZNIJ <span className="text-primary">TERAZ</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Dołącz do 1000+ firm, które zautomatyzowały swój marketing
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg"
                  onClick={() => navigate("/campaign")}
                >
                  Wypróbuj za darmo
                </Button>

                <Button
                  onClick={() => navigate("/campaign")}
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg"
                >
                  Zobacz demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Bez karty kredytowej • 14 dni trial • Anuluj w każdej chwili
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-black tracking-tighter">
              WISEADS<span className="text-primary">.</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Wszystkie prawa zastrzeżone
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;