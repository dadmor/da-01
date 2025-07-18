// src/pages/dance-styles/create.tsx
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";

export const DanceStylesCreate = () => {
  const { list } = useNavigation();

  const {
    refineCore: { onFinish },
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("dance_styles")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title="Dodaj styl tańca"
          description="Dodaj nowy styl do katalogu"
        />
      </FlexBox>

      <Card>
        <CardHeader>
          <CardTitle>Informacje o stylu</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit(onFinish)}>
            <FormControl
              label="Nazwa stylu"
              htmlFor="name"
              error={errors.name?.message as string}
              required
            >
              <Input
                id="name"
                placeholder="np. Salsa Kubańska"
                {...register("name", {
                  required: "Nazwa stylu jest wymagana",
                  minLength: {
                    value: 2,
                    message: "Nazwa musi mieć minimum 2 znaki",
                  },
                })}
              />
            </FormControl>

            <FormControl
              label="Opis"
              htmlFor="description"
              error={errors.description?.message as string}
            >
              <Textarea
                id="description"
                placeholder="Opisz charakterystykę stylu, pochodzenie, podstawowe kroki..."
                rows={4}
                {...register("description")}
              />
            </FormControl>

            <FormControl
              label="Pochodzenie"
              htmlFor="origin"
              error={errors.origin?.message as string}
            >
              <Input
                id="origin"
                placeholder="np. Kuba"
                {...register("origin")}
              />
            </FormControl>

            <FormControl
              label="Poziom trudności"
              htmlFor="difficulty"
              error={errors.difficulty?.message as string}
            >
              <Input
                id="difficulty"
                placeholder="np. Średni"
                {...register("difficulty")}
              />
            </FormControl>

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => list("dance_styles")}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Dodawanie..." : "Dodaj styl"}
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};