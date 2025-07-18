import { useForm } from "@refinedev/react-hook-form";
import { useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { useLoading } from "@/utility";

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "E-commerce",
  "Education",
  "Real Estate",
  "Food & Beverage",
  "Travel",
  "Fashion",
  "Automotive",
];

export const WebsiteAnalysisEdit = () => {
  const { list, show } = useNavigation();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  const {
    refineCore: { onFinish, queryResult },
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const data = queryResult?.data;
  const isLoading = queryResult?.isLoading ?? false;
  const isError = queryResult?.isError ?? false;
  const record = data?.data;
  const init = useLoading({ isLoading, isError });

  useEffect(() => {
    if (record) {
      reset({
        url: record.url,
        description: record.description,
        industry: record.industry,
        keywords: record.keywords || [],
      });
      setKeywords(record.keywords || []);
    }
  }, [record, reset]);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      const newKeywords = [...keywords, keywordInput.trim()];
      setKeywords(newKeywords);
      setValue("keywords", newKeywords);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = keywords.filter((k) => k !== keywordToRemove);
    setKeywords(newKeywords);
    setValue("keywords", newKeywords);
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Analysis not found</p>
          <Button className="mt-4" onClick={() => list("website_analyses")}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => show("website_analyses", record.id!)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Details
      </Button>

      <FlexBox>
        <Lead
          title="Edit Website Analysis"
          description={`Update the website analysis information • ID: #${String(
            record.id
          ).slice(0, 8)}`}
        />
      </FlexBox>

      <Card>
        <CardHeader>
          <CardTitle>Website Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit(onFinish)}>
            <GridBox variant="1-2-2">
              <FormControl
                label="Website URL"
                htmlFor="url"
                error={errors.url?.message as string}
                required
              >
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  {...register("url", {
                    required: "URL is required",
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: "Please enter a valid URL",
                    },
                  })}
                />
              </FormControl>

              <FormControl
                label="Industry"
                error={errors.industry?.message as string}
                required
              >
                <Select
                  value={watch("industry")}
                  onValueChange={(value) => setValue("industry", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry.toLowerCase()}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </GridBox>

            <FormControl
              label="Description"
              htmlFor="description"
              error={errors.description?.message as string}
              required
            >
              <Textarea
                id="description"
                placeholder="Describe the website's purpose, target audience, and main features..."
                rows={4}
                {...register("description", {
                  required: "Description is required",
                  minLength: {
                    value: 20,
                    message: "Description must be at least 20 characters",
                  },
                })}
              />
            </FormControl>

            <FormControl
              label="Keywords"
              error={
                keywords.length === 0
                  ? "At least one keyword is required"
                  : undefined
              }
              required
            >
              <FlexBox variant="start">
                <Input
                  placeholder="Add a keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeywordKeyPress}
                  className="flex-1"
                />
                <Button type="button" onClick={addKeyword} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </FlexBox>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormControl>

            {record.created_at && (
              <FlexBox variant="end" className="text-xs text-muted-foreground">
                <div>
                  <span>Created:</span>
                  {new Date(record.created_at).toLocaleDateString()}
                </div>
                {record.updated_at && (
                  <div>
                    <span>Last Updated:</span>
                    {new Date(record.updated_at).toLocaleDateString()}
                  </div>
                )}
              </FlexBox>
            )}

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => show("website_analyses", record.id!)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || keywords.length === 0}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
