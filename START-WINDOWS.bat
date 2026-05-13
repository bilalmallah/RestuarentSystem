@echo off
echo ================================================
echo   RestaurantOS v2.0 - PostgreSQL Edition
echo ================================================
echo.
echo IMPORTANT: Make sure PostgreSQL is running!
echo Edit backend\.env with your postgres password first.
echo.
echo Step 1: Running database migrations...
cd backend
call npm install
call node migrate.js
if %errorlevel% neq 0 (
  echo.
  echo ERROR: Migration failed! Check your .env file and PostgreSQL connection.
  pause
  exit /b 1
)
echo.
echo Step 2: Starting Backend Server...
start "RestaurantOS Backend" cmd /k "node server.js"
cd ..
echo.
echo Waiting for backend to start...
timeout /t 4 /nobreak > nul
echo.
echo Step 3: Starting Frontend...
cd frontend
call npm install
start "RestaurantOS Frontend" cmd /k "npm start"
cd ..
echo.
echo ================================================
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:3000
echo  Login:    owner / 1234  or  manager / 1234
echo  pgAdmin:  Connect to localhost:5432
echo  Database: RestaurantOS
echo ================================================
pause
