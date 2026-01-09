from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Refund
from .serializers import RefundSerializer

class RefundViewSet(viewsets.ModelViewSet):
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        student_name = self.request.query_params.get('student_name')
        if student_name:
            queryset = queryset.filter(student_name__icontains=student_name)
        return queryset.order_by('-refund_date')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a refund request"""
        refund = self.get_object()
        if refund.status != 'Pending':
            return Response({'error': 'Only pending refunds can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund.status = 'Approved'
        refund.approved_by = request.user
        refund.processed_at = timezone.now()
        refund.save()
        return Response(RefundSerializer(refund).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a refund request"""
        refund = self.get_object()
        if refund.status != 'Pending':
            return Response({'error': 'Only pending refunds can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund.status = 'Rejected'
        refund.approved_by = request.user
        refund.processed_at = timezone.now()
        refund.rejection_reason = request.data.get('reason', '')
        refund.save()
        return Response(RefundSerializer(refund).data)
