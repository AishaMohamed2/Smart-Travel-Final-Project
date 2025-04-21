# Smart-Travel-Final-Project 

##STEP 1: Create & Activate Virtual Environment

####Windows (PowerShell)
- python -m venv env (Create env)            
- .\env\Scripts\activate (Activate env) 

####macOS / Linux (Terminal)
- python3 -m venv env (Create env)            
- source env/bin/activate (Activate env) 

##STEP 2: Install Backend Dependencies

####All OS (with env activated)
- cd backend
- install python version 3.13.3 or higher 
- pip install -r requirements.txt (Install Python dependencies)
- cd ../

##STEP 3: Install Frontend Dependencies

####All OS (with env activated)
- cd frontend
- npm install 
- cd ../

##STEP 4: Database Setup (PostgreSQL + pgAdmin 4)
##Install PostgreSQL

####Windows (PowerShell)
- Download from [PostgreSQL.org ](https://www.postgresql.org/download/windows/)

####macOS 
-  Use [PostgreSQL.app ](https://postgresapp.com)

####Linux (Debian/Ubuntu)
- sudo apt update
- sudo apt install postgresql postgresql-contrib pgadmin4

####Verify PostgreSQL Version
- psql --version (recommended: 15.11)

####After Downloading 
- Create database named smarttraveldatabase in the database

####Update in settings.py
- Open backend/settings.py and set your PostgreSQL password (used in pgAdmin).

####Run Migrations (with env activated)
- cd backend
- python manage.py migrate  

##STEP 5: Run server and local host in
####All OS (with env activated)
- cd backend -> python manage.py runserver
- cd frontend -> npm run dev -> click on the link it gives you 