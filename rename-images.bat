@echo off
setlocal enabledelayedexpansion

echo Renaming .png files to .PNG...

set "imagesPath=c:\Projects\Windows\React\PawMarker\packages\app\public\images"

REM Array of folders
set "folders[0]=EurasianOtter"
set "folders[1]=Leopard"
set "folders[2]=Rhinoceros"
set "folders[3]=Slothbear"
set "folders[4]=SpottedDeer"
set "folders[5]=Stripedhyena"
set "folders[6]=Wildboar"
set "folders[7]=WildDog"

REM Loop through each folder
for /l %%i in (0,1,7) do (
    set "folder=!folders[%%i]!"
    set "folderPath=!imagesPath!\!folder!"
    
    echo Processing !folder!...
    cd /d "!folderPath!"
    
    REM Rename all .png files to .PNG
    for %%f in (*.png) do (
        set "oldName=%%f"
        set "newName=!oldName:.png=.PNG!"
        ren "!oldName!" "!newName!"
        echo   Renamed: !oldName! to !newName!
    )
)

echo.
echo Done! All .png files have been renamed to .PNG
pause