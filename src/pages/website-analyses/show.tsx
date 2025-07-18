import { useShow, useNavigation, useDelete, useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Tag,
  Globe,
  FileText,
  Target,
  DollarSign,
  Eye,
  Plus,
  Sparkles,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";

export const WebsiteAnalysisShow = () => {
  const { queryResult } = useShow();
  const { list, edit, show } = useNavigation();
  const navigate = useNavigate();
  const { mutate: deleteAnalysis } = useDelete();

  const { data, isLoading, isError } = queryResult;
  const record = data?.data;

  // Fetch related marketing strategies
  const { data: strategiesData, isLoading: strategiesLoading } = useList({
    resource: "marketing_strategies",
    filters: [
      {
        field: "website_analysis_id",
        operator: "eq",
        value: record?.id,
      },
    ],
    pagination: {
      mode: "off",
    },
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
  });

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Analysis not found</p>
          <Button className="mt-4" onClick={() => list("website_analyses")}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (
      record?.id &&
      confirm(
        "Are you sure you want to delete this analysis? This action cannot be undone."
      )
    ) {
      deleteAnalysis(
        {
          resource: "website_analyses",
          id: record.id,
        },
        {
          onSuccess: () => {
            list("website_analyses");
          },
        }
      );
    }
  };

  const relatedStrategies = strategiesData?.data || [];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("website_analyses")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>

      <FlexBox>
        <Lead
          title={`Website Analyses`}
          description={` ID: #${String(record.id).slice(0, 8)}`}
        />
        <FlexBox className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (record?.id != null) {
                edit("website_analyses", record.id);
              }
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </FlexBox>
      </FlexBox>

      {/* Main Content */}
      <GridBox>
        {/* Primary Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <FlexBox>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Website URL
                </CardTitle>

                <Badge variant="secondary" className="text-sm">
                  {record.industry}
                </Badge>
              </FlexBox>
            </CardHeader>
            <CardContent className="text-lg font-mono">
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                {record.url}
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Keywords ({record.keywords?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {record.keywords?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Marketing Strategies */}
          <Card>
            <CardHeader>
              <FlexBox>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Related Marketing Strategies ({relatedStrategies.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/website-analyses/${record.id}/strategy/step1`)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Dodaj nową
                </Button>
              </FlexBox>
            </CardHeader>
            <CardContent>
              {strategiesLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : relatedStrategies.length > 0 ? (
                <div className="space-y-4">
                  {relatedStrategies.map((strategy: any, index: number) => (
                    <div
                      key={strategy.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium text-sm">
                              {strategy.title}
                            </h4>
                            {strategy.industry_override && (
                              <Badge variant="outline" className="text-xs">
                                {strategy.industry_override}
                              </Badge>
                            )}
                          </div>

                          {strategy.target_audience && (
                            <p className="text-sm text-muted-foreground mb-2">
                              <Target className="w-3 h-3 inline mr-1" />
                              {strategy.target_audience.substring(0, 100)}...
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {strategy.budget_recommendation && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {strategy.budget_recommendation.toLocaleString()} PLN
                              </span>
                            )}
                            <span>
                              Created:{" "}
                              {new Date(
                                strategy.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              show("marketing_strategies", strategy.id)
                            }
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              edit("marketing_strategies", strategy.id)
                            }
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-4">
                    Brak strategii marketingowych dla tej analizy.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/website-analyses/${record.id}/strategy/step1`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Wygeneruj pierwszą strategię
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Statistics</p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Keywords:</span>
                    <span className="font-medium">
                      {record.keywords?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium capitalize">
                      {record.industry}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Description Length:
                    </span>
                    <span className="font-medium">
                      {record.description?.length || 0} chars
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strategies:</span>
                    <span className="font-medium">
                      {relatedStrategies.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate(`/website-analyses/${record.id}/strategy/step1`)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generuj nową strategię
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => window.open(record.url, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (record?.id != null) {
                    edit("website_analyses", record.id);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </>
  );
};