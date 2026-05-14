from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Teacher
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class StudentGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGroup
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class PZKChairmanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PZKChairman
        fields = '__all__'

class DeputyDirectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeputyDirector
        fields = '__all__'

class GeneratedTicketSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    teachers = TeacherSerializer(many=True, read_only=True)  # ИСПРАВЛЕНО: teachers
    chairman = PZKChairmanSerializer(read_only=True)
    deputy_director = DeputyDirectorSerializer(read_only=True)
    groups = StudentGroupSerializer(many=True, read_only=True)
    
    class Meta:
        model = GeneratedTicket
        fields = '__all__'