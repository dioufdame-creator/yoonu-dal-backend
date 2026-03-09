from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

class BasicAPITests(APITestCase):
    def test_register_endpoint(self):
        """Test that the register endpoint accepts POST requests"""
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123',
            'password2': 'testpassword123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)