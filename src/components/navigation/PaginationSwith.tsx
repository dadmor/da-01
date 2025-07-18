import { Button } from "@/components/ui/button";
import { FlexBox } from "@/components/shared";

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  setCurrent: (page: number) => void;
  itemName?: string; // np. "campaigns", "analyses", "items"
}

export const PaginationSwith = ({ 
  current, 
  pageSize, 
  total, 
  setCurrent, 
  itemName = "items" 
}: PaginationProps) => {
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);
  const isFirstPage = current === 1;
  const isLastPage = current * pageSize >= total;

  return (
    <FlexBox>
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} {itemName}
      </div>
      <FlexBox>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrent(current - 1)}
          disabled={isFirstPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrent(current + 1)}
          disabled={isLastPage}
        >
          Next
        </Button>
      </FlexBox>
    </FlexBox>
  );
};