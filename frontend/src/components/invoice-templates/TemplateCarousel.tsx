import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InvoiceClassic from "./template-classic";
import ModernInvoiceTemplate from "./template-Modern";
import PremiumMinimalInvoice from "./template-minimal";
import ProfessionalInvoiceTemplate from "./template-professional";

interface Template {
  id: string;
  name: string;
  preview: string;
  component: React.ComponentType<any>;
}

interface TemplateCarouselProps {
  templates: Template[];
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  invoiceData: any;
}

const TemplateCarousel: React.FC<TemplateCarouselProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  // @ts-ignore
  invoiceData,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [slidesPerView, setSlidesPerView] = React.useState(3);

  React.useEffect(() => {
    const updateSlidesPerView = () => {
      setSlidesPerView(1); // Always show 1 template per row
    };
    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  const maxIndex = Math.max(templates.length - slidesPerView, 0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex <= 0 ? maxIndex : prevIndex - 1
    );
  };

  const getTemplateComponent = (templateId: string) => {
    switch (templateId) {
      case "modern":
        return ModernInvoiceTemplate;
      case "classic":
        return InvoiceClassic;
      case "minimal":
        return PremiumMinimalInvoice;
      case "gujarat":
        return ProfessionalInvoiceTemplate;
      default:
        return ModernInvoiceTemplate;
    }
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Select Template</h3>
        <div className="flex items-center gap-4 ">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {Math.ceil(templates.length / slidesPerView)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden ">
        <div
          className="flex transition-transform duration-300 ease-in-out gap-4 sm:gap-8 lg:gap-12"
          style={{
            transform: `translateX(-${(currentIndex * 100) / slidesPerView}%)`,
          }}
        >
          {templates.map((template) => {
            // @ts-ignore
            const TemplateComponent = getTemplateComponent(template.id);
            return (
              <div
                key={template.id}
                className="w-full sm:w-1/2 md:w-1/2 lg:w-1/3 xl:w-1/5 flex-shrink-0 px-1 sm:px-2 lg:px-2"
                onClick={() => onSelectTemplate(template.id)}
              >
                <Card
                  className={`h-72 w-72 cursor-pointer transition-all overflow-hidden group relative ${selectedTemplate === template.id
                    ? "border-4 border-blue-300 shadow-lg"
                    : "hover:border-primary/50 hover:shadow-md"
                    }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <img src={template.preview} className="object-contain w-full h-full" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  {selectedTemplate === template.id && (
                    <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
                  )}
                </Card>
                <div className="mt-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium">{template.name}</h4>
                  {selectedTemplate === template.id && (
                    <span className="text-xs text-blue-300 font-medium">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 639px) {
          .flex > div.w-full { width: 100% !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .flex > div.sm\\:w-1\/2 { width: 50% !important; }
        }
        @media (min-width: 1024px) {
          .flex > div.lg\\:w-1\/3 { width: 33.3333% !important; }
        }
      `}</style>
    </div>
  );
};

export default TemplateCarousel;

