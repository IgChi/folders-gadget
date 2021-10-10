# folders-gadget
### Desktop Gadget for Win 7-10. Implements folders with shortcuts as in Android / IOS.

![alt text](https://github.com/IgChi/folders-gadget/blob/main/images/icon.png)

![alt text](https://github.com/IgChi/folders-gadget/blob/main/images/preview-1.png)

![alt text](https://github.com/IgChi/folders-gadget/blob/main/images/preview-2.png)

## Installation:
1. If your system does not support gadgets, then download a third-party program, f.e. `8GadgetPack`.
2. Create folder in C:\Users\USERNAME\AppData\Local\Microsoft\Windows Sidebar\Gadgets\ with all project files:
```
(f.e. 'C:\Users\USERNAME\AppData\Local\Microsoft\Windows Sidebar\Gadgets\Folder.gadget')
```
After that you can see Folders Gadget in the gadgets selection menu. Just Drag & Drop shortcuts to Folders Gadget.

3. For second, 3th, 4th, ... folder you need to create this gadget DUPLICATE in your gadget's folder:
```
(f.e. 'C:\Users\USERNAME\AppData\Local\Microsoft\Windows Sidebar\Gadgets\Folder-2.gadget')
```
And change the Name in Folder-2.gadget/gadget.xml (displayed in the gadgets selection menu):
```
 <name>Folder</name> ---> <name>Folder/Audio Apps</name>
```
