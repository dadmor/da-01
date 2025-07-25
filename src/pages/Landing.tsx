import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Calendar,
  Heart,
  Trophy,
  Music,
  MapPin,
  Star,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import RodoDisclaimer from "./RodoDisclamer";
import KhakiBackgroundSVG from "@/components/KhakiBackgroundSVG";

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: "WYDARZENIA TANECZNE",
      desc: "Twórz i odkrywaj wydarzenia w klubach, szkołach tańca i plenerze",
      features: ["Imprezy klubowe", "Warsztaty taneczne", "Eventy plenerowe"],
      color: "from-purple-500/20 to-purple-600/10",
    },
    {
      icon: Trophy,
      title: "SYSTEM GAMIFIKACJI",
      desc: "Zdobywaj punkty, odznaki i awansuj w rankingu tancerzy",
      features: [
        "Poziomy doświadczenia",
        "Wyzwania tygodniowe",
        "Nagrody społeczności",
      ],
      color: "from-amber-500/20 to-amber-600/10",
    },
    {
      icon: Users,
      title: "SPOŁECZNOŚĆ TRENERSKA",
      desc: "Ucz się od najlepszych lub dziel się swoją wiedzą",
      features: ["Lekcje indywidualne", "Grupy treningowe", "Mentoring online"],
      color: "from-blue-500/20 to-blue-600/10",
    },
  ];

  const chartData = [
    { day: "Pon", aktywni: 1240, wydarzenia: 45 },
    { day: "Wto", aktywni: 1650, wydarzenia: 62 },
    { day: "Śro", aktywni: 1480, wydarzenia: 51 },
    { day: "Czw", aktywni: 1890, wydarzenia: 78 },
    { day: "Pią", aktywni: 2450, wydarzenia: 125 },
    { day: "Sob", aktywni: 3200, wydarzenia: 186 },
    { day: "Nie", aktywni: 2800, wydarzenia: 142 },
  ];

  interface ChartDataPoint {
    day: string;
    aktywni: number;
    wydarzenia: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: ChartDataPoint;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">Aktywni: {payload[0].value}</p>
          <p className="text-sm text-muted-foreground">
            Wydarzenia: {payload[0].payload.wydarzenia}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RodoDisclaimer />
      {/* Navigation */}
      <nav className="fixed  top-0 w-full z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            DANCE HUB<span className="text-primary">.</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Button variant="ghost" className="text-sm font-medium">
              Funkcje
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Społeczność
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Wydarzenia
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/register")}
            >
              Dołącz teraz <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <KhakiBackgroundSVG />
        </div>

        <div className="container mx-auto px-6 z-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-8" variant="secondary">
                <Heart className="mr-2 h-3 w-3" />
                Dla pasjonatów tańca
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-8">
                TWOJA
                <br />
                <span className="text-primary">TANECZNA</span>
                <br />
                SPOŁECZNOŚĆ
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-xl">
                Odkryj wydarzenia, ucz się od najlepszych, znajdź idealnego
                partnera tanecznego. Dołącz do platformy, która łączy tancerzy z
                całej Polski.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Input
                  type="email"
                  placeholder="twoj@email.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-14 px-5 text-base"
                />
                <Button size="lg" className="h-14 px-8 font-bold text-base">
                  Rozpocznij przygodę <ArrowRight className="ml-2" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>15k+ tancerzy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>500+ wydarzeń/mies.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>System dopasowań</span>
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
                  {/* App Preview Header */}
                  <div className="border-b px-6 py-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Dance Hub</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        twoj.profil
                      </span>
                    </div>
                  </div>

                  {/* App Content Preview */}
                  <div className="p-8">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Twój Dashboard
                    </h3>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          42
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Wydarzenia
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-500">
                          Lvl 8
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Poziom
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">127</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Znajomi
                        </p>
                      </div>
                    </div>

                    {/* Activity Chart */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground">
                        Aktywność społeczności
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsBarChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="opacity-30"
                          />
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
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="aktywni"
                            fill="hsl(var(--primary))"
                            radius={[8, 8, 0, 0]}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Upcoming Events */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div>
                            <span className="text-sm font-medium">
                              Salsa Night
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Klub Proxima, dziś 20:00
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          23 osoby
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="w-4 h-4 text-amber-500" />
                          <div>
                            <span className="text-sm font-medium">
                              Workshop: Bachata
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Studio Dance, sob 14:00
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          8 miejsc
                        </Badge>
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
              Wszystko w jednym miejscu
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              PLATFORMA DLA <span className="text-primary">TANCERZY</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kompleksowe rozwiązanie dla społeczności tanecznej
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

          {/* Partner Matching Feature */}
          <Card className="mt-12 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">
                  ZNAJDŹ IDEALNEGO{" "}
                  <span className="text-primary">PARTNERA</span>
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Nasz inteligentny system dopasowań pomoże Ci znaleźć osobę o
                  podobnym poziomie umiejętności, preferencjach muzycznych i
                  dostępności czasowej. Taniec we dwoje nigdy nie był prostszy!
                </p>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-20">
              JAK TO <span className="text-primary">DZIAŁA</span>
            </h2>

            <div className="space-y-16">
              {[
                {
                  num: "01",
                  title: "STWÓRZ PROFIL",
                  desc: "Opisz swoje umiejętności, style tańca i cele. System gamifikacji rozpocznie śledzenie Twoich postępów.",
                },
                {
                  num: "02",
                  title: "ODKRYWAJ WYDARZENIA",
                  desc: "Przeglądaj imprezy w klubach, warsztaty w szkołach tańca i spontaniczne spotkania plenerowe.",
                },
                {
                  num: "03",
                  title: "UCZ SIĘ I UCZ INNYCH",
                  desc: "Dołącz do lekcji prowadzonych przez doświadczonych tancerzy lub sam zostań trenerem.",
                },
                {
                  num: "04",
                  title: "BUDUJ SPOŁECZNOŚĆ",
                  desc: "Poznawaj nowych ludzi, znajduj partnerów tanecznych i rozwijaj swoją pasję razem z innymi.",
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
                icon: Users,
                value: "15k+",
                label: "AKTYWNYCH TANCERZY",
                desc: "Rosnąca społeczność pasjonatów",
              },
              {
                icon: Calendar,
                value: "500+",
                label: "WYDARZEŃ MIESIĘCZNIE",
                desc: "W całej Polsce",
              },
              {
                icon: Star,
                value: "4.8/5",
                label: "OCENA APLIKACJI",
                desc: "Od naszych użytkowników",
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
                ZATAŃCZ Z <span className="text-primary">NAMI</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Dołącz do największej społeczności tanecznej w Polsce. Pierwsze
                30 dni premium gratis!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg"
                  onClick={() => navigate("/register")}
                >
                  Dołącz za darmo
                </Button>

                <Button
                  onClick={() => navigate("/app-preview")}
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg"
                >
                  Zobacz aplikację
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Bez zobowiązań • Premium 30 dni gratis • Anuluj w każdej chwili
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Music className="w-6 h-6 text-primary" />
              DANCE HUBR<span className="text-primary">.</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Dance Hub. Stworzone z pasją dla tańca.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
