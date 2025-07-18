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
import { ArrowLeft } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl, KeywordsField } from "@/components/form";

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

export const WebsiteAnalysisCreate = () => {
  const { list } = useNavigation();

  const {
    refineCore: { onFinish },
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const keywords = watch("keywords") || [];

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
          title="Create Website Analysis"
          description="Add a new website for analysis"
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
                  onValueChange={(value) => setValue("industry", value)}
                  {...register("industry", {
                    required: "Industry is required",
                  })}
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

            <KeywordsField
              value={keywords}
              onChange={(newKeywords) => setValue("keywords", newKeywords)}
              required
              minKeywords={1}
              maxKeywords={10}
            />

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => list("website_analyses")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || keywords.length === 0}
              >
                {isSubmitting ? "Creating..." : "Create Analysis"}
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
