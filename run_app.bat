@echo off
echo =============================================================
echo Starting Morocco Driving School Management System (MDSMS)
echo Auto Ecole Karima (Chez Chakib, Sale)
echo =============================================================

:: Set Java Home to the OpenJDK 21 installed on the system
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

:: Check if backend folder exists
if not exist backend (
    echo Error: backend folder not found!
    pause
    exit /b
)

:: Start Backend Spring Boot in a new command window
echo [MDSMS] Starting Backend on http://localhost:8080 ...
start "MDSMS Backend (Spring Boot)" cmd /c "cd backend && ..\tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

:: Start Frontend Vite Server in a new command window
echo [MDSMS] Starting Frontend on http://localhost:5173 ...
start "MDSMS Frontend (React)" cmd /c "cd frontend && npm run dev"

echo.
echo =============================================================
echo MDSMS Started Successfully!
echo - Web Application: http://localhost:5173
echo - REST Backend API: http://localhost:8080
echo - Local H2 Database Console: http://localhost:8080/h2-console
echo   (JDBC URL: jdbc:h2:file:./data/drivingschool, User: sa, Pwd: password)
echo.
echo Logins preconfigured for test:
echo - Director (Admin): admin / admin123
echo - Assistant: assistant / assistant123
echo - Moniteur: youssef / youssef123
echo - Candidate: student1 / student123
echo =============================================================
pause
