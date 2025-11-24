from core.models import Enquiry, Registration, Enrollment, FollowUp
from core.serializers import EnquirySerializer, RegistrationSerializer, EnrollmentSerializer, FollowUpSerializer

models = [Enquiry, Registration, Enrollment, FollowUp]
serializers = [EnquirySerializer, RegistrationSerializer, EnrollmentSerializer, FollowUpSerializer]

print("Checking Models for created_by...")
for m in models:
    has_field = any(f.name == 'created_by' for f in m._meta.fields)
    print(f"{m.__name__}: {has_field}")

print("\nChecking Serializers for created_by_name...")
for s in serializers:
    serializer = s()
    has_field = 'created_by_name' in serializer.fields
    print(f"{s.__name__}: {has_field}")
