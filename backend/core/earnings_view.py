from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from datetime import datetime, timedelta
from django.utils import timezone
from collections import defaultdict
from .models import (
    User, Enquiry, Registration, Enrollment, Payment, Document,
    DocumentTransfer, Task, Appointment, University, Template,
    Notification, Commission, Refund, LeadSource, VisaTracking, FollowUp,
    Installment, Agent, ChatConversation, ChatMessage, GroupChat, SignupRequest,
    ApprovalRequest
)


class EarningsRevenueView(APIView):
    """
    Company Admin Earnings API - calculates earnings based on payments and enrollments
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Only COMPANY_ADMIN and DEV_ADMIN can access
        if user.role not in ['COMPANY_ADMIN', 'DEV_ADMIN']:
            return Response({'error': 'Permission denied'}, status=403)
        
        # Filter by company for COMPANY_ADMIN
        company_id = user.company_id if user.role == 'COMPANY_ADMIN' else None
        
        # Get time range
        today = timezone.now().date()
        current_month_start = datetime(today.year, today.month, 1).date()
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        year_start = datetime(today.year, 1, 1).date()
        
        # Get payments filtered by company
        payments_query = Payment.objects.all()
        enrollments_query = Enrollment.objects.all()
        registrations_query = Registration.objects.all()
        
        if company_id:
            payments_query = payments_query.filter(company_id=company_id)
            enrollments_query = enrollments_query.filter(company_id=company_id)
            registrations_query = registrations_query.filter(company_id=company_id)
        
        # Current month metrics
        current_month_payments = payments_query.filter(
            date__gte=current_month_start,
            status='Success'
        )
        
        current_month_revenue = current_month_payments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Calculate commission (profit) if applicable
        current_month_enrollments = enrollments_query.filter(
            start_date__gte=current_month_start
        )
        current_month_commission = current_month_enrollments.aggregate(
            total=Sum('commission_amount')
        )['total'] or 0
        
        # Last month for growth calculation
        last_month_payments = payments_query.filter(
            date__gte=last_month_start,
            date__lt=current_month_start,
            status='Success'
        )
        last_month_revenue = last_month_payments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Revenue growth
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = round(((current_month_revenue - last_month_revenue) / last_month_revenue) * 100, 1)
        
        # Student counts
        current_month_registrations = registrations_query.filter(
            registration_date__gte=current_month_start
        ).count()
        
        last_month_registrations = registrations_query.filter(
            registration_date__gte=last_month_start,
            registration_date__lt=current_month_start
        ).count()
        
        student_growth = 0
        if last_month_registrations > 0:
            student_growth = round(((current_month_registrations - last_month_registrations) / last_month_registrations) * 100, 1)
        
        # Average deal size
        avg_deal_size = 0
        if current_month_registrations > 0:
            avg_deal_size = round(current_month_revenue / current_month_registrations)
        
        # Monthly earnings for the year (for charts)
        monthly_earnings = []
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for month_num in range(1, 13):
            if month_num > today.month and year_start.year == today.year:
                break
                
            month_start = datetime(today.year, month_num, 1).date()
            if month_num == 12:
                month_end = datetime(today.year + 1, 1, 1).date()
            else:
                month_end = datetime(today.year, month_num + 1, 1).date()
            
            month_payments = payments_query.filter(
                date__gte=month_start,
                date__lt=month_end,
                status='Success'
            )
            
            month_revenue = month_payments.aggregate(total=Sum('amount'))['total'] or 0
            
            month_enrollments = enrollments_query.filter(
                start_date__gte=month_start,
                start_date__lt=month_end
            )
            month_commission = month_enrollments.aggregate(total=Sum('commission_amount'))['total'] or 0
            
            monthly_earnings.append({
                'month': months[month_num - 1],
                'revenue': float(month_revenue),
                'profit': float(month_commission)
            })
        
        # Revenue by source
        registration_fees = payments_query.filter(
            status='Success',
            date__gte=current_month_start
        ).filter(Q(type__icontains='Registration') | Q(type='Registration')).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        enrollment_fees = payments_query.filter(
            status='Success',
            date__gte=current_month_start
        ).filter(Q(type__icontains='Enrollment') | Q(type='Enrollment')).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        other_fees = current_month_revenue - registration_fees - enrollment_fees
        
        revenue_by_source = [
            {'name': 'Registration Fees', 'value': float(registration_fees), 'color': '#0d9488'},
            {'name': 'Enrollment Fees', 'value': float(enrollment_fees), 'color': '#10b981'},
            {'name': 'Other Fees', 'value': float(other_fees), 'color': '#8b5cf6'}
        ]
        
        return Response({
            'currentMonth': {
                'revenue': float(current_month_revenue),
                'profit': float(current_month_commission),
                'registrations': current_month_registrations,
                'revenueGrowth': revenue_growth,
                'profitGrowth': revenue_growth,  # Using same as revenue for simplicity
                'studentGrowth': student_growth,
                'avgDealSize': avg_deal_size,
                'dealSizeChange': 0  # Can be calculated if needed
            },
            'monthlyEarnings': monthly_earnings,
            'revenueBySource': revenue_by_source
        })
