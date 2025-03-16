
import { toast } from "@/components/ui/use-toast";

/**
 * وظيفة مساعدة لعرض التنبيهات بطريقة موحدة
 */
export const notify = {
  success: (message: string) => {
    toast({
      title: "نجاح",
      description: message,
    });
  },
  error: (message: string, error?: any) => {
    console.error("خطأ:", error || message);
    toast({
      variant: "destructive",
      title: "خطأ",
      description: message,
    });
  },
  info: (message: string) => {
    toast({
      description: message,
    });
  },
};
