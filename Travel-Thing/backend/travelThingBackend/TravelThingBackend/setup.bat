@echo off
echo Installing required packages...
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design

echo Creating database...
dotnet ef database update --context ApplicationDbContext

echo Done!
pause 