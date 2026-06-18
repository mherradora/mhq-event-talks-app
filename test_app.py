import unittest
from app import app

class TestApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_index(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'BigQuery Release Notes', response.data)

    def test_get_notes(self):
        response = self.app.get('/api/notes')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('updates', data)
        self.assertIn('title', data)
        self.assertGreater(len(data['updates']), 0)
        
        # Verify fields in updates
        first_update = data['updates'][0]
        self.assertIn('id', first_update)
        self.assertIn('date', first_update)
        self.assertIn('type', first_update)
        self.assertIn('html', first_update)
        self.assertIn('text', first_update)
        self.assertIn('url', first_update)

if __name__ == '__main__':
    unittest.main()
