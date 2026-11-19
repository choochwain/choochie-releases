Heart Clicker pop-up media
==========================

Put pictures, sounds and videos for each pop-up level in its folder:

  level1  (from the start)      level6  (250M all-time hearts)
  level2  (1K)                  level7  (5B)
  level3  (25K)                 level8  (100B)
  level4  (500K)                level9  (2.5T)
  level5  (10M)                 level10 (75T)

Levels never end: level 11, 12, ... unlock at 75T x 30, x 900, ... and use the highest folder that has files.
You can also add level11, level12, ... folders and they are used once unlocked.

Pictures: png jpg gif webp avif svg   Sounds: mp3 ogg wav m4a aac opus flac   Videos: mp4 webm ogv mov m4v
Sub-folders are fine. Names starting with "." or "_" are ignored. Optional: a _name.txt with a level title on line 1.
Pictures and videos show at their own size (shrunk only when bigger than the play area). Videos play to the end (30 s max).
A level with no files uses the built-in pictures, text stickers and her voice sounds.

After adding or removing files, rebuild the list (from the repo root):

  node tools/clicker_manifest.js        (or double-click tools\clicker_manifest.cmd)

then commit and push. The GitHub Action "Clicker media manifest" also rebuilds it on every push that touches this folder,
and on GitHub Pages the game also reads the folder listing directly, so pushed files show up even before the list is rebuilt.
