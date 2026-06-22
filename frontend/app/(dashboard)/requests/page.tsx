"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import type { OutingRequest, Employee } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Clock, Briefcase, User, ArrowLeftRight, RefreshCw, Filter, Calendar, Search, MoreHorizontal, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"



export default function RequestsPage() {
  const { user } = useAuth()

  const searchParams = useSearchParams()
  const router = useRouter()

  const tabFromUrl = searchParams.get("tab") || "pending"
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  
  const [requests, setRequests] = useState<OutingRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<OutingRequest | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [reviewRemarks, setReviewRemarks] = useState("")
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
   setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    dataStore.init()
    setRequests(dataStore.getOutingRequests())
    setEmployees(dataStore.getEmployees())
    setLoading(false)
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    return employee?.name || "Unknown"
  }

  const getEmployeeInfo = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)
  }

  const handleApprove = (request: OutingRequest) => {
    setSelectedRequest(request)
    setReviewRemarks("")
    setReviewDialogOpen(true)
  }

  const handleDeny = (request: OutingRequest) => {
    setSelectedRequest(request)
    setReviewRemarks("")
    setReviewDialogOpen(true)
  }

  const submitReview = (decision: "approved" | "denied") => {
    if (!selectedRequest || !user) return

    dataStore.reviewOutingRequest(
      selectedRequest.id,
      decision,
      user.id,
      reviewRemarks
    )
    loadData()
    setReviewDialogOpen(false)
    setSelectedRequest(null)
  }

  const handleMarkReturn = (requestId: string) => {
    dataStore.markOutingReturn(requestId)
    loadData()
  }

  const filteredRequests = requests.filter(r => {
    const dateMatch = r.date === filterDate
    const statusMatch = filterStatus === "all" || r.status === filterStatus
    
    let searchMatch = true
    if (searchQuery) {
      const employee = getEmployeeInfo(r.employeeId)
      const query = searchQuery.toLowerCase()
      searchMatch = 
        (employee?.name || "").toLowerCase().includes(query) ||
        (employee?.employeeId || "").toLowerCase().includes(query) ||
        (employee?.department || "").toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query)
    }
    
    return dateMatch && statusMatch && searchMatch
  })

  const pendingRequests = requests.filter(r => r.status === "pending")
  const todayRequests = requests.filter(r => r.date === new Date().toISOString().split("T")[0])
  const outOnApproved = todayRequests.filter(r => r.status === "approved" && !r.actualReturnTime)

  const getStatusBadge = (status: OutingRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Approved</Badge>
      case "denied":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Denied</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPurposeBadge = (purpose: OutingRequest["purpose"]) => {
    return purpose === "official" ? (
      <Badge className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">
        <Briefcase className="h-3 w-3" />
        Official
      </Badge>
    ) : (
      <Badge className="gap-1 bg-purple-100 text-purple-800 hover:bg-purple-100 border-0">
        <User className="h-3 w-3" />
        Personal
      </Badge>
    )
  }

  // Render table component for reuse
  const renderRequestsTable = (requestsList: OutingRequest[]) => {
    if (requestsList.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-lg bg-white">
          <Clock className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium text-black">No requests found</p>
          <p className="text-xs mt-1">No records available for this section</p>
        </div>
      )
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0B2E4F] hover:bg-[#0B2E4F]">
              <TableHead className="px-4 py-3 text-white font-semibold">Employee</TableHead>
              <TableHead className="px-4 py-3 text-white font-semibold">Time</TableHead>
              <TableHead className="px-4 py-3 text-white font-semibold">Purpose</TableHead>
              <TableHead className="px-4 py-3 text-white font-semibold">Reason</TableHead>
              <TableHead className="px-4 py-3 text-white font-semibold">Return</TableHead>
              <TableHead className="px-4 py-3 text-white font-semibold">Status</TableHead>
              <TableHead className="px-4 py-3 text-white font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestsList.map((request, index) => (
              <TableRow 
                key={request.id}
                className={cn(
                  index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                )}
              >
                <TableCell className="px-4 py-3 font-medium">
                  <div>
                    <p className="font-medium text-slate-900">{getEmployeeName(request.employeeId)}</p>
                    <p className="text-xs text-slate-500">
                      {getEmployeeInfo(request.employeeId)?.designation || "Staff"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">{request.requestTime}</TableCell>
                <TableCell className="px-4 py-3">{getPurposeBadge(request.purpose)}</TableCell>
                <TableCell className="px-4 py-3 max-w-[200px] truncate" title={request.reason}>
                  {request.reason}
                </TableCell> 
                <TableCell className="px-4 py-3">
                  {request.willReturn ? (
                    <span className="text-sm">
                      {request.actualReturnTime ? (
                        <span className="text-green-600">
                          Returned at {request.actualReturnTime}
                        </span>
                      ) : (
                        <span className="text-yellow-600">
                          Expected: {request.expectedReturnTime}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">No return</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-center px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedRequest(request)
                          setViewDetailsOpen(true)
                        }}
                        className="gap-2 text-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </DropdownMenuItem>
                      
                      {request.status === "pending" && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleApprove(request)}
                            className="gap-2 text-sm text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeny(request)}
                            className="gap-2 text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Deny
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {request.status === "approved" && request.willReturn && !request.actualReturnTime && (
                        <DropdownMenuItem 
                          onClick={() => handleMarkReturn(request.id)}
                          className="gap-2 text-sm text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark Return
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Outing Requests</h1>
          <p className="text-base text-slate-500">
            Review and manage staff outing requests
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Today&apos;s Requests</p>
                <p className="text-2xl font-bold text-slate-900">{todayRequests.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Currently Out</p>
                <p className="text-2xl font-bold text-amber-600">{outOnApproved.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">Approved Today</p>
                <p className="text-2xl font-bold text-emerald-600">{todayRequests.filter(r => r.status === "approved").length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {setActiveTab(val) 
          router.push(`/requests?tab=${val}`)
        }} className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Currently Out ({outOnApproved.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            All Requests
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab - Table View */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                Pending Approval
              </CardTitle>
              <CardDescription>
                Review and approve or deny staff outing requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(pendingRequests)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currently Out Tab - Table View */}
        <TabsContent value="active" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                  <ArrowLeftRight className="h-4 w-4 text-orange-500" />
                </div>
                Staff Currently Out
              </CardTitle>
              <CardDescription>
                Track staff who are currently out of office and mark their return
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(outOnApproved)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Requests Tab - Table View with Filters */}
        <TabsContent value="all" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Filter className="h-4 w-4 text-blue-500" />
                </div>
                Request History
              </CardTitle>
              <CardDescription>
                View and filter all outing requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-end flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by employee, department, or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-40 h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 h-10 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              {renderRequestsTable(filteredRequests)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

{/* View Details Dialog */}
<Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Request Details</DialogTitle>
      <DialogDescription>
        Complete information about this outing request
      </DialogDescription>
    </DialogHeader>

    {selectedRequest && (
      <div className="space-y-6">
        {/* Top section: Employee Info */}
        <div className="grid grid-cols-2 gap-6 border rounded-lg p-4 bg-muted/30">
          <div>
            <Label className="text-muted-foreground">Employee Name</Label>
            <p className="text-base font-semibold">{getEmployeeName(selectedRequest.employeeId)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Department</Label>
            <p className="text-base font-semibold">
              {getEmployeeInfo(selectedRequest.employeeId)?.department || "N/A"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Request Date</Label>
            <p className="text-base font-semibold">{selectedRequest.date}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Request Time</Label>
            <p className="text-base font-semibold">{selectedRequest.requestTime}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Purpose</Label>
            <p className="text-base font-semibold">{selectedRequest.purpose}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
          </div>
        </div>

        {/* Reason */}
        <div>
          <Label className="text-muted-foreground">Reason</Label>
          <p className="p-3 bg-muted rounded-lg mt-1 text-sm leading-relaxed">
            {selectedRequest.reason}
          </p>
        </div>

        {/* Return Times */}
        <div className="grid grid-cols-2 gap-6">
          {selectedRequest.willReturn && (
            <div>
              <Label className="text-muted-foreground">Expected Return Time</Label>
              <p className="font-medium text-yellow-600">{selectedRequest.expectedReturnTime}</p>
            </div>
          )}
          {selectedRequest.actualReturnTime && (
            <div>
              <Label className="text-muted-foreground">Actual Return Time</Label>
              <p className="font-medium text-green-600">{selectedRequest.actualReturnTime}</p>
            </div>
          )}
        </div>

        {/* Reviewer Remarks */}
        {selectedRequest.reviewerRemarks && (
          <div>
            <Label className="text-muted-foreground">Reviewer Remarks</Label>
            <p className="p-3 bg-muted rounded-lg mt-1 text-sm leading-relaxed">
              {selectedRequest.reviewerRemarks}
            </p>
          </div>
        )}
      </div>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => setViewDetailsOpen(false)} className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] hover:border-[#0b2e4f] transition-colors">
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


{/* Review Dialog */}
<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
  <DialogContent className="max-w-md p-6">
    {/* Header */}
    <DialogHeader className="border-b border-slate-200 pb-4">
      <DialogTitle className="text-lg font-semibold text-slate-900">
        Review Outing Request
      </DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        Add remarks before approving or denying this request
      </DialogDescription>
    </DialogHeader>

    {/* Body */}
    {selectedRequest && (
      <div className="py-6 space-y-6">
        {/* Request Details */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">Request Information</h4>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-slate-600">Employee</span>
              <p className="font-medium">{getEmployeeName(selectedRequest.employeeId)}</p>
            </div>
            <div>
              <span className="text-slate-600">Department</span>
              <p className="font-medium">
                {getEmployeeInfo(selectedRequest.employeeId)?.department}
              </p>
            </div>
            <div>
              <span className="text-slate-600">Purpose</span>
              <p className="font-medium">
                {selectedRequest.purpose === "official" ? "Official Work" : "Personal Work"}
              </p>
            </div>
            <div>
              <span className="text-slate-600">Reason</span>
              <p className="font-medium">{selectedRequest.reason}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-600">Will Return</span>
              <p className="font-medium">
                {selectedRequest.willReturn
                  ? `Yes, by ${selectedRequest.expectedReturnTime}`
                  : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Remarks (Optional)
          </label>
          <Textarea
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
            placeholder="Add any remarks for this decision..."
            rows={3}
            className="border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>
    )}

    {/* Footer */}
    <DialogFooter className="border-t border-slate-200 pt-4 flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        onClick={() => setReviewDialogOpen(false)}
        className="h-10 border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={() => submitReview("denied")}
        className="h-10 w-full sm:w-auto"
      >
        Deny
      </Button>
      <Button
        onClick={() => submitReview("approved")}
        className="h-10 bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
      >
        Approve
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  )
}