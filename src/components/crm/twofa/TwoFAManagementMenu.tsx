"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/crm/ui";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { Enable2FADialog } from "./Enable2FADialog";
import { ViewBackupCodesDialog } from "./ViewBackupCodesDialog";
import { Disable2FADialog } from "./Disable2FADialog";
import { Reconfigure2FADialog } from "./Reconfigure2FADialog";
import { Settings, Eye, RefreshCw, ShieldOff, ChevronDown } from "lucide-react";

interface TwoFAManagementMenuProps {
  onStatusChange?: () => void;
}

export function TwoFAManagementMenu({ onStatusChange }: TwoFAManagementMenuProps) {
  const { status } = useTwoFAStore();
  const [enableOpen, setEnableOpen] = useState(false);
  const [viewCodesOpen, setViewCodesOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [reconfigureOpen, setReconfigureOpen] = useState(false);

  const isEnabled = status?.enabled ?? false;

  const handleEnableComplete = () => {
    setEnableOpen(false);
    onStatusChange?.();
  };

  const handleDisableComplete = () => {
    setDisableOpen(false);
    onStatusChange?.();
  };

  const handleReconfigureComplete = () => {
    setReconfigureOpen(false);
    onStatusChange?.();
  };

  if (!isEnabled) {
    return (
      <>
        <Button variant="secondary" size="sm" onClick={() => setEnableOpen(true)}>
          启用
        </Button>
        <Enable2FADialog open={enableOpen} onOpenChange={handleEnableComplete} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            管理
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setViewCodesOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            查看备份码
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReconfigureOpen(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重新配置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDisableOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <ShieldOff className="w-4 h-4 mr-2" />
            禁用 2FA
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Enable2FADialog open={enableOpen} onOpenChange={handleEnableComplete} />
      <ViewBackupCodesDialog open={viewCodesOpen} onOpenChange={setViewCodesOpen} />
      <Disable2FADialog open={disableOpen} onOpenChange={handleDisableComplete} />
      <Reconfigure2FADialog open={reconfigureOpen} onOpenChange={handleReconfigureComplete} />
    </>
  );
}
