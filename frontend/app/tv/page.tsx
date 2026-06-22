"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { dataStore } from "@/lib/data-store"
import type { Employee, AttendanceRecord, LeaveRequest } from "@/lib/types"
import { BackgroundPattern } from '@/components/background-pattern'

// Bhutanese Proverbs
const PROVERBS = [
  { text: "Individual success depends on success as a nation – no one succeeds when the nation has failed.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "Our size is our greatest strength.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "Rise to the challenge, change our mindset, think big and work hard.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "We cannot change the past, but we can shape the future.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "The strength of a nation lies in its people, their dreams, and their determination.", author: "Jigme Khesar Namgyel Wangchuck" },
  { text: "We cannot afford to be timid, avoid what we don’t yet understand and hope for the best. Such an attitude will cost us our national objective of self-reliance.", author: "Jigme Khesar Namgyel Wangchuck" },
]

export default function TVDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map())
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employeeStatuses, setEmployeeStatuses] = useState<Map<string, { status: string; remarks: string }>>(new Map())
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentProverbIndex, setCurrentProverbIndex] = useState(0)
  const [quoteFade, setQuoteFade] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [activeStickyDept, setActiveStickyDept] = useState<string | null>(null)
  const [headerTransitioning, setHeaderTransitioning] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastVisibleDeptRef = useRef<string | null>(null)
  const isAutoScrollingRef = useRef(true)
  const scrollSpeedRef = useRef(0.8)
  const isResettingRef = useRef(false)

  // Get today's date in local timezone consistently
  const getTodayDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = getTodayDate()

  // Group employees by department
  const groupedEmployees = useMemo(() => {
    return employees.reduce((acc, employee) => {
      const dept = employee.department
      if (!acc[dept]) acc[dept] = []
      acc[dept].push(employee)
      return acc
    }, {} as Record<string, Employee[]>)
  }, [employees])

  const departmentList = useMemo(() => Object.keys(groupedEmployees), [groupedEmployees])
  
  const departmentListKey = departmentList.join(',')

  const loopedDepartments = useMemo(() => {
    if (departmentList.length === 0) return []
    return [...departmentList, ...departmentList]
  }, [departmentListKey, departmentList.length])

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [isClient])

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteFade(false)
      setTimeout(() => {
        setCurrentProverbIndex((prev) => (prev + 1) % PROVERBS.length)
        setQuoteFade(true)
      }, 500)
    }, 8000)
    return () => clearInterval(quoteInterval)
  }, [])

  // Setup scroll listener for sticky header detection
  useEffect(() => {
    if (!isClient || !scrollContainerRef.current || departmentList.length === 0) return

    const scrollContainer = scrollContainerRef.current
    const viewportTop = scrollContainer.getBoundingClientRect().top

    const checkVisibleDepartments = () => {
      if (isResettingRef.current) return
      
      let currentVisibleDept: string | null = null
      const allSections = scrollContainer.querySelectorAll('.department-section')
      
      for (let i = 0; i < allSections.length; i++) {
        const section = allSections[i] as HTMLDivElement
        const sectionRect = section.getBoundingClientRect()
        const sectionTop = sectionRect.top
        const sectionBottom = sectionRect.bottom
        
        const isContentVisible = sectionBottom > viewportTop && sectionTop < window.innerHeight
        
        if (isContentVisible) {
          const deptHeader = section.querySelector('.original-dept-header h2')
          if (deptHeader) {
            currentVisibleDept = deptHeader.textContent?.trim() || null
            break
          }
        }
      }

      if (currentVisibleDept && currentVisibleDept !== lastVisibleDeptRef.current) {
        setHeaderTransitioning(true)
        setTimeout(() => {
          setActiveStickyDept(currentVisibleDept)
          lastVisibleDeptRef.current = currentVisibleDept
          setTimeout(() => setHeaderTransitioning(false), 400)
        }, 50)
      }
      
      if (!lastVisibleDeptRef.current && departmentList.length > 0) {
        const firstDept = departmentList[0]
        setActiveStickyDept(firstDept)
        lastVisibleDeptRef.current = firstDept
      }
    }

    setTimeout(checkVisibleDepartments, 100)
    scrollContainer.addEventListener('scroll', checkVisibleDepartments)
    window.addEventListener('resize', checkVisibleDepartments)
    const intervalId = setInterval(checkVisibleDepartments, 100)

    return () => {
      scrollContainer.removeEventListener('scroll', checkVisibleDepartments)
      window.removeEventListener('resize', checkVisibleDepartments)
      clearInterval(intervalId)
    }
  }, [isClient, departmentListKey])

  // Auto-scroll functionality
  useEffect(() => {
    if (!isClient || employees.length === 0 || loopedDepartments.length === 0) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const autoScroll = () => {
      if (!scrollContainer || !isAutoScrollingRef.current) return

      const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight
      let newScrollTop = scrollContainer.scrollTop + scrollSpeedRef.current

      if (newScrollTop >= maxScrollTop) {
        const singleCycleHeight = maxScrollTop / 2
        isResettingRef.current = true
        scrollContainer.scrollTop = singleCycleHeight / 2
        isResettingRef.current = false
        animationRef.current = requestAnimationFrame(autoScroll)
      } else {
        scrollContainer.scrollTop = newScrollTop
        animationRef.current = requestAnimationFrame(autoScroll)
      }
    }

    isAutoScrollingRef.current = true
    animationRef.current = requestAnimationFrame(autoScroll)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      isAutoScrollingRef.current = false
    }
  }, [isClient, employees, loopedDepartments])

  // Load data with more frequent refresh and proper status calculation
  useEffect(() => {
    if (!isClient) return
    
    dataStore.init()
    loadData()

    // Refresh every 5 seconds instead of 30 for real-time updates
    const refreshInterval = setInterval(loadData, 5000)
    return () => clearInterval(refreshInterval)
  }, [isClient])

  const loadData = () => {
    const emps = dataStore.getEmployees().filter(e => e.status === "Active")
    setEmployees(emps)

    // Get ALL attendance records for today, not just filtered
    const allAttendance = dataStore.getAttendance()
    const attendanceMap = new Map<string, AttendanceRecord>()
    
    // Log for debugging
    console.log("Today's date:", today)
    console.log("Total attendance records:", allAttendance.length)
    
    allAttendance.forEach(record => {
      // Compare dates properly - handle potential timezone issues
      const recordDate = record.date.split('T')[0] // Ensure we only compare date part
      if (recordDate === today) {
        attendanceMap.set(record.employeeId, record)
        console.log(`Found attendance for employee ${record.employeeId}:`, record)
      }
    })
    
    setAttendanceRecords(attendanceMap)

    const allLeaves = dataStore.getLeaveRequests()
    setLeaveRequests(allLeaves)

    // Calculate status for each employee
    const statuses = new Map()
    emps.forEach(emp => {
      // Check for active leave first
      const activeLeave = allLeaves.find(l =>
        l.employeeId === emp.id && l.startDate <= today && l.endDate >= today
      )

      if (activeLeave) {
        const start = new Date(activeLeave.startDate).toLocaleDateString()
        const end = new Date(activeLeave.endDate).toLocaleDateString()
        statuses.set(emp.id, {
          status: "On Leave",
          remarks: `Leave from ${start} to ${end}`
        })
      } else {
        const attendanceRecord = attendanceMap.get(emp.id)
        
        // CRITICAL FIX: Proper status determination
        if (!attendanceRecord) {
          statuses.set(emp.id, {
            status: "Absent",
            remarks: "Not checked in today"
          })
        } else if (attendanceRecord.checkOut) {
          // Employee has checked out - still shows as Present for the day
          statuses.set(emp.id, {
            status: "Present",
            remarks: `Checked in at ${attendanceRecord.checkIn}, checked out at ${attendanceRecord.checkOut}`
          })
        } else if (attendanceRecord.status === "Late") {
          statuses.set(emp.id, {
            status: "Late",
            remarks: `Arrived late at ${attendanceRecord.checkIn}`
          })
        } else if (attendanceRecord.status === "Present" || attendanceRecord.checkIn) {
          statuses.set(emp.id, {
            status: "Present",
            remarks: `Checked in at ${attendanceRecord.checkIn}`
          })
        } else {
          statuses.set(emp.id, {
            status: "Absent",
            remarks: "No check-in record found"
          })
        }
      }
    })
    
    setEmployeeStatuses(statuses)
    console.log("Employee statuses calculated:", Array.from(statuses.entries()))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).toUpperCase()
  }

  const getEmployeeStatusBadge = (employee: Employee): { status: string; time: string; badgeClass: string } => {
    const status = employeeStatuses.get(employee.id)
    
    if (status?.status === "On Leave") {
      return { 
        status: "On Leave", 
        time: "-", 
        badgeClass: "bg-purple-800 text-white border-purple-400/50"
      }
    }
    
    if (status?.status === "Late") {
      const time = status.remarks?.match(/\d{1,2}:\d{2}/)?.[0] || "-"
      return { 
        status: "Late", 
        time: time,
        badgeClass: "bg-amber-800 text-amber-300 border-amber-400/50"
      }
    }
    
    if (status?.status === "Present") {
      const time = status.remarks?.match(/\d{1,2}:\d{2}/)?.[0] || "-"
      return { 
        status: "Present", 
        time: time,
        badgeClass: "bg-emerald-800 text-white border-emerald-400/50"
      }
    }
    
    return { 
      status: "Absent", 
      time: "-",
      badgeClass: "bg-red-800 text-white border-red-400/50"
    }
  }

  const getDepartmentCount = (dept: string): number => {
    return groupedEmployees[dept]?.length || 0
  }

  const getCurrentDeptIndex = (): number => {
    if (!activeStickyDept) return 0
    return departmentList.indexOf(activeStickyDept)
  }

  if (!isClient || !currentTime) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundPattern />
        <div className="flex items-center justify-center h-screen relative z-10">
          <div className="text-3xl text-cyan-400 animate-pulse">Loading Display...</div>
        </div>
      </div>
    )
  }

  const renderLoopContent = () => {
    return loopedDepartments.map((department, idx) => {
      const deptEmployees = groupedEmployees[department]
      if (!deptEmployees) return null
      
      return (
        <div 
          key={`${department}-${idx}`}
          className="animate-fadeIn department-section"
          style={{ animationDuration: '0.6s' }}
        >
          <div className="original-dept-header mb-5">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-12 bg-gradient-to-b from-[#0B2E4F] to-[#1a5a92] rounded-full" />
              <h2 className="text-3xl font-bold text-[#0B2E4F] tracking-wider">
                {department.toUpperCase()}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#0B2E4F]/30 to-transparent" />
              <div className="text-2xl font-bold text-slate-400">{deptEmployees.length}</div>
            </div>
          </div>

          <div className="space-y-4">
            {deptEmployees.map((employee, empIdx) => {
              const { status, time, badgeClass } = getEmployeeStatusBadge(employee)
              const statusData = employeeStatuses.get(employee.id)
              const remarks = statusData?.remarks || "No additional information"
              
              return (
                <div
                  key={`${employee.id}-${idx}`}
                  className="group relative overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 hover:border-cyan-500/70 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
                  style={{
                    animation: `slideIn 0.4s ease-out ${empIdx * 0.03}s both`
                  }}
                >
                  <div className="relative px-6 pt-4 pb-3 flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#0B2E4F] to-[#1a5a92] flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-8 min-w-0">
                      <div className="min-w-[180px] max-w-[260px]">
                        <div className="relative overflow-hidden group/name">
                          <h3 className="text-xl font-bold text-black tracking-tight whitespace-nowrap hover:animate-marquee">
                            {employee.name}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="min-w-[180px] max-w-[240px]">
                        <div className="relative overflow-hidden group/designation">
                          <p className="text-lg text-slate-700 whitespace-nowrap hover:animate-marquee">
                            {employee.designation}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className="text-xl text-[#0B2E4F]">📞</span>
                        <span className="text-xl text-[#0B2E4F] font-bold tracking-wide">
                          {employee.contactNumber || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-sm shadow-md ${badgeClass}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                            status === "Present" ? "bg-emerald-400" :
                            status === "Late" ? "bg-amber-400" :
                            status === "On Leave" ? "bg-purple-400" :
                            "bg-red-400"
                          }`} />
                          <div className="text-right">
                            <div className="text-xl font-bold leading-tight">
                              {status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative px-6 pb-4 pt-1">
                    <div className="flex items-center gap-3 bg-slate-50/80 rounded-lg px-4 py-2.5 border-l-4 border-l-[#0B2E4F]">
                      <div className="flex-shrink-0">
                        <span className="text-base text-slate-500">💬</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-base text-slate-700 font-medium">
                          {remarks}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundPattern />
      
      <div className="relative z-10 flex flex-col h-screen p-8">
        
        {/* Header Section */}
        <div className="flex-shrink-0 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <img src="/icon.png" alt="Logo" className="h-30 w-30 object-contain" />
              <div>
                <h1 className="text-4xl font-bold text-[#0B2E4F] tracking-tight">
                  Staff Information Display
                </h1>
                <p className="text-2xl text-slate-700 font-semibold mt-1">
                  Thimphu Dzongkhag Administration
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-black tabular-nums text-[#0B2E4F]">
                {formatTime(currentTime)}
              </div>
              <div className="text-xl font-bold text-[#0B2E4F] mt-3 tracking-wide">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
          
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-[#0B2E4F]/50 to-transparent" />
        </div>

        {/* Auto-scroll indicator */}
        <div className="flex-shrink-0 mb-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B2E4F]/10 rounded-full backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-600 font-medium">
              Live Auto-Scrolling Display (Updates every 5 seconds)
            </span>
          </div>
        </div>

        {/* Sticky Department Header */}
        {activeStickyDept && (
          <div 
            className={`sticky-header-container flex-shrink-0 z-30 mb-4 transition-all duration-500 ${
              headerTransitioning ? 'opacity-90 scale-[0.98] -translate-y-1' : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B2E4F]/5 via-transparent to-[#0B2E4F]/5 rounded-2xl" />
              
              <div className="relative px-6 py-4 flex items-center gap-4">
                <div className="w-2 h-12 bg-gradient-to-b from-[#0B2E4F] to-[#1a5a92] rounded-full animate-pulse" />
                <h2 className="text-3xl font-bold text-[#0B2E4F] tracking-wider">
                  {activeStickyDept.toUpperCase()}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#0B2E4F]/30 to-transparent" />
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#0B2E4F]/10 rounded-full backdrop-blur-sm">
                    <span className="text-xl"></span>
                    <span className="text-2xl font-bold text-[#0B2E4F]">{getDepartmentCount(activeStickyDept)}</span>
                    <span className="text-base text-slate-600">members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {departmentList.map((dept, idx) => (
                      <div
                        key={dept}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          dept === activeStickyDept
                            ? 'w-8 bg-[#0B2E4F] shadow-lg'
                            : idx < getCurrentDeptIndex()
                            ? 'w-3 bg-[#0B2E4F]/40'
                            : 'w-3 bg-slate-300/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Attendance Section */}
        <div className="flex-1 min-h-0">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto hide-scrollbar"
            style={{ scrollBehavior: 'auto' }}
          >
            <div className="space-y-8 pb-6">
              {renderLoopContent()}
              
              {employees.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-2xl text-black">Loading staff data...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="flex-shrink-0 space-y-4 mt-8">
          <div className={`relative overflow-hidden rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-600/50 p-6 transition-all duration-500 ${quoteFade ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="relative flex items-center gap-5">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-[#0B2E4F] flex items-center justify-center shadow-lg shadow-gray-200/20">
                  <span className="text-3xl">💬</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-medium text-white leading-relaxed">
                  "{PROVERBS[currentProverbIndex].text}"
                </p>
                <p className="text-base text-gray-100 mt-2 font-medium">
                  — {PROVERBS[currentProverbIndex].author}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 8s linear infinite;
          display: inline-block;
          padding-left: 100%;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .group\/name:hover .whitespace-nowrap,
        .group\/designation:hover .whitespace-nowrap {
          animation: marquee 6s linear infinite;
        }

        .sticky-header-container {
          animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .department-section {
          scroll-margin-top: 80px;
        }

        .original-dept-header {
          visibility: visible;
          opacity: 1;
        }

        .overflow-y-auto {
          scroll-behavior: auto;
        }
      `}</style>
    </div>
  )
}
