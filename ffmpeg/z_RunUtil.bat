@echo off
Color F1 && cls
Title Convert Avi To Flv
@echo on

set file=StairsReindeer

ffmpeg -i %file%.mov -f flv %file%.flv
flvtool2 - U %file%.flv


::ffmpeg -i Cash_Folsom_Prison.flv -f avi Cash_Folsom_Prison.avi
::ffmpeg -i Cash_Folsom_Prison.avi -f flv Cash_Folsom_Prison.flv

::flvmdi Cash_Folsom_Prison.flv 01_Cash_Folsom_Prison.flv /x /k /l /p
::flvtool2 -U Dust_In_The_Wind.flv

pause
