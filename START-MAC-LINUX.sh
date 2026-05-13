#!/bin/bash
echo "================================================"
echo "  RestaurantOS v2.0 - PostgreSQL Edition"
echo "================================================"
echo ""
echo "Make sure PostgreSQL is running and backend/.env is configured!"
echo ""

# Run migrations
echo "Running migrations..."
cd backend
npm install
node migrate.js
if [ $? -ne 0 ]; then
  echo "Migration failed! Check .env and PostgreSQL."
  exit 1
fi

# Start backend
echo "Starting backend..."
node server.js &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================================"
echo " Backend:  http://localhost:3001"
echo " Frontend: http://localhost:3000"
echo " Login:    owner/1234 or manager/1234"
echo " Database: RestaurantOS (PostgreSQL)"
echo "================================================"
echo "Press Ctrl+C to stop"
wait $BACKEND_PID $FRONTEND_PID
