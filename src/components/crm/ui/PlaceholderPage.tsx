"use client";

import { PageHeader } from "./PageHeader";
import { FileQuestion, Construction } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  showConstruction?: boolean;
  className?: string;
}

export function PlaceholderPage({
  title,
  description = "This module is under development.",
  showConstruction = true,
  className,
}: PlaceholderPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <PageHeader
        title={title}
        description={description}
      />
      
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          {showConstruction ? (
            <Construction className="w-12 h-12 text-gray-400" />
          ) : (
            <FileQuestion className="w-12 h-12 text-gray-400" />
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        
        <p className="text-gray-500 text-center max-w-md">
          {description}
        </p>
        
        {showConstruction && (
          <div className="mt-6 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm">
              🚧 This page is under construction
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
