"use client"

import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Switch,
  Checkbox,
  Alert,
  AlertDescription,
  AlertTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
  Skeleton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Pagination,
  RadioGroup,
  RadioGroupItem,
  useToast,
} from "@/components/ui"
import { PageHeader } from "@/components/crm/ui"

export default function UIShowcasePage() {
  const { success, error, warning, info } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [usPersonChecked, setUsPersonChecked] = useState(false)

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="UI 组件展示"
        description="TradePass 设计系统组件库"
      />

      {/* Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-4">颜色系统</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ColorCard name="Primary" color="bg-blue-600" text="text-white" />
          <ColorCard name="Success" color="bg-emerald-500" text="text-white" />
          <ColorCard name="Warning" color="bg-amber-500" text="text-white" />
          <ColorCard name="Error" color="bg-red-500" text="text-white" />
          <ColorCard name="Info" color="bg-blue-500" text="text-white" />
          <ColorCard name="Gray 50" color="bg-slate-50" text="text-slate-900" />
          <ColorCard name="Gray 100" color="bg-slate-100" text="text-slate-900" />
          <ColorCard name="Gray 800" color="bg-slate-800" text="text-white" />
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">按钮 Button</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-xl font-semibold mb-4">徽章 Badge</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge dot variant="success">With Dot</Badge>
              <Badge dot variant="error">With Dot</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Form Elements */}
      <section>
        <h2 className="text-xl font-semibold mb-4">表单元素</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name" required>姓名</Label>
                <Input id="name" placeholder="请输入姓名" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" placeholder="请输入邮箱" error="邮箱格式不正确" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">简介</Label>
              <Textarea id="bio" rows={3} maxLength={200} showCount placeholder="请输入简介" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="switch1" />
                <Label htmlFor="switch1">开关</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Checkbox vs Radio Comparison */}
      <section>
        <h2 className="text-xl font-semibold mb-4">复选框 vs 单选框</h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Checkbox Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-5 h-5 rounded border-2 border-[var(--tp-primary)] bg-[var(--tp-primary)] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900">Checkbox 复选框 <span className="text-xs font-normal text-slate-400 ml-1">☑ 方形</span></h3>
                </div>
                <p className="text-sm text-slate-500">方形，可多选，使用对勾标记</p>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb-unchecked" />
                    <Label htmlFor="cb-unchecked">未选中状态</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb-checked" defaultChecked />
                    <Label htmlFor="cb-checked">已选中状态</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb-disabled" disabled />
                    <Label htmlFor="cb-disabled" className="opacity-50">禁用状态</Label>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase">多选示例</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox id="skill1" defaultChecked />
                      <Label htmlFor="skill1">JavaScript</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="skill2" />
                      <Label htmlFor="skill2">TypeScript</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="skill3" defaultChecked />
                      <Label htmlFor="skill3">React</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Radio Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--tp-primary)] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--tp-primary)]" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Radio 单选框 <span className="text-xs font-normal text-slate-400 ml-1">○ 圆形</span></h3>
                </div>
                <p className="text-sm text-slate-500">圆形，单选互斥，使用圆点标记</p>
                
                <RadioGroup defaultValue="">
                  <div className="space-y-3 pt-2">
                    <RadioGroupItem value="unchecked">未选中状态</RadioGroupItem>
                  </div>
                </RadioGroup>
                <RadioGroup defaultValue="checked">
                  <div className="space-y-3">
                    <RadioGroupItem value="checked">已选中状态</RadioGroupItem>
                  </div>
                </RadioGroup>
                <RadioGroup defaultValue="">
                  <div className="space-y-3 opacity-50">
                    <RadioGroupItem value="disabled" disabled>禁用状态</RadioGroupItem>
                  </div>
                </RadioGroup>

                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-400 uppercase mb-2">单选示例</p>
                  <RadioGroup defaultValue="monthly">
                    <div className="space-y-2">
                      <RadioGroupItem value="monthly">月付</RadioGroupItem>
                      <RadioGroupItem value="yearly">年付（省20%）</RadioGroupItem>
                      <RadioGroupItem value="lifetime">终身</RadioGroupItem>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Checkbox Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">复选框 Checkbox - 完整示例</h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Controlled Checkbox Demo */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-500">受控组件示例</h3>
              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <Checkbox
                  id="us-person"
                  checked={usPersonChecked}
                  onCheckedChange={(checked) => setUsPersonChecked(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="us-person" className="font-medium">
                    I am a U.S. Person
                  </Label>
                  <p className="text-sm text-slate-500">
                    Check this box if you are a U.S. citizen, U.S. resident, or U.S. entity for tax purposes.
                  </p>
                </div>
              </div>

              {/* Conditional Sub-options */}
              {usPersonChecked && (
                <div className="ml-7 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <Checkbox id="us-citizen" />
                    <Label htmlFor="us-citizen">U.S. Citizen</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="us-resident" />
                    <Label htmlFor="us-resident">U.S. Resident</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="green-card" />
                    <Label htmlFor="green-card">U.S. Green Card Holder</Label>
                  </div>
                  <div className="pt-2">
                    <Label htmlFor="tax-id">Tax ID (SSN/ITIN)</Label>
                    <Input id="tax-id" placeholder="Enter your Tax ID" className="mt-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox Group */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-500">复选框组</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">I agree to the Terms of Service</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="privacy" />
                  <Label htmlFor="privacy">I agree to the Privacy Policy</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="marketing" />
                  <Label htmlFor="marketing">I want to receive marketing emails (optional)</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Avatars */}
      <section>
        <h2 className="text-xl font-semibold mb-4">头像 Avatar</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar size="xs"><AvatarFallback>XS</AvatarFallback></Avatar>
              <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
              <Avatar size="md"><AvatarFallback>MD</AvatarFallback></Avatar>
              <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
              <Avatar size="xl"><AvatarFallback>XL</AvatarFallback></Avatar>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-xl font-semibold mb-4">警告 Alert</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Alert>
              <AlertTitle>默认提示</AlertTitle>
              <AlertDescription>这是一条默认提示信息</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>成功</AlertTitle>
              <AlertDescription>操作已成功完成</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>警告</AlertTitle>
              <AlertDescription>请注意检查相关信息</AlertDescription>
            </Alert>
            <Alert variant="error">
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>操作失败，请重试</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="text-xl font-semibold mb-4">对话框 Dialog</h2>
        <Card>
          <CardContent className="p-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>打开对话框</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认操作</DialogTitle>
                  <DialogDescription>
                    确定要执行此操作吗？此操作不可撤销。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>确认</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>

      {/* Tooltip */}
      <section>
        <h2 className="text-xl font-semibold mb-4">提示 Tooltip</h2>
        <Card>
          <CardContent className="p-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">悬停查看提示</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这是一个提示信息</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </section>

      {/* Tabs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">标签页 Tabs</h2>
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">基本信息</TabsTrigger>
                <TabsTrigger value="tab2">高级设置</TabsTrigger>
                <TabsTrigger value="tab3">安全设置</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <p className="text-slate-600">基本信息内容</p>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <p className="text-slate-600">高级设置内容</p>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <p className="text-slate-600">安全设置内容</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Progress */}
      <section>
        <h2 className="text-xl font-semibold mb-4">进度条 Progress</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Progress value={30} label="进行中" showValue />
            <Progress value={60} variant="success" label="成功进度" showValue />
            <Progress value={80} variant="warning" label="警告进度" showValue />
            <Progress value={45} variant="error" label="错误进度" showValue />
          </CardContent>
        </Card>
      </section>

      {/* Skeleton */}
      <section>
        <h2 className="text-xl font-semibold mb-4">骨架屏 Skeleton</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton circle className="h-12 w-12" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Breadcrumb */}
      <section>
        <h2 className="text-xl font-semibold mb-4">面包屑 Breadcrumb</h2>
        <Card>
          <CardContent className="p-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">首页</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/users">用户管理</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>用户详情</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </CardContent>
        </Card>
      </section>

      {/* Pagination */}
      <section>
        <h2 className="text-xl font-semibold mb-4">分页 Pagination</h2>
        <Card>
          <CardContent className="p-6">
            <Pagination
              current={currentPage}
              pageSize={10}
              total={100}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            />
          </CardContent>
        </Card>
      </section>

      {/* Toast */}
      <section>
        <h2 className="text-xl font-semibold mb-4">轻提示 Toast</h2>
        <Card>
          <CardContent className="p-6 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => success("操作成功")}>成功</Button>
              <Button onClick={() => error("操作失败")} variant="destructive">错误</Button>
              <Button onClick={() => warning("请注意")} variant="outline">警告</Button>
              <Button onClick={() => info("提示信息")} variant="secondary">信息</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Card Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">卡片 Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>卡片标题</CardTitle>
              <CardDescription>卡片描述信息</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">卡片内容区域</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">取消</Button>
              <Button size="sm">确认</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  )
}

function ColorCard({ name, color, text }: { name: string; color: string; text: string }) {
  return (
    <div className={`${color} ${text} p-4 rounded-lg`}>
      <p className="font-medium">{name}</p>
    </div>
  )
}
