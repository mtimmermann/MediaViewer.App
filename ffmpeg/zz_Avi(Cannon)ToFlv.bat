@echo off
Color F1 && cls
Title Convert Avi To Flv
@echo on


set file=2008.01_09
set aviPath=C:\Users\Mark\Documents\Pictures\Romeo\Video\
set flvPath=C:\_Dev\WebSites\VideoViewer\VideoViewer\Video\01Romeo\

mencoder %aviPath%%file%.avi -vf eq2=1.6,hqdn3d -oac copy -ovc lavc -o %file%.avi
ffmpeg -i %file%.avi %file%.mp4
ffmpeg -i %file%.mp4 -f flv %flvPath%%file%.flv
flvtool2 -U %flvPath%%file%.flv

::// http://community.moertel.com/ss/space/Tech+Recipies/Improving+MJPEG+movies+taken+by+digital+cameras
::mencoder MVI_1297.avi -vf eq2=1.6,hqdn3d -oac copy -ovc lavc -o output.avi

erase %file%.avi
erase %file%.mp4


pause

goto End

:: # %1 = ffmpeg directory
:: # %2 = Avi Path
:: # %3 = Avi Name
:: # %4 = Flv Name
:: # %5 = Flv Output directory
::%1ffmpeg -i %2%3 -ab 56 -ar 44100 -b 275 -r 20 -f flv %1%4
::%1ffmpeg -i %2%3 -ab 64 -ar 44100 -b 27500 -r 29 -f flv %1%4
::%1ffmpeg -i %2%3 -f flv %1%4

:End
