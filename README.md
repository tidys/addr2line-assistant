这个插件是分析leak-tracer的内存泄露日志，leak-tracer也有解析日志的脚步，但是并不是太好用。

> 目前仅支持windows
## 使用前的配置
- set leak file：
  
  设置内存泄露的日志文件，推荐`files/Download/leak_report.txt`，这个路径要和app日志的保存位置有关系。
- set executable file

  携带调试符号文件的路径，addr2line命令行需要这个参数

- set leak rank

  过滤内存泄露的结果，显示最大的结果。默认显示20个，建议不要设置过大！
## 使用步骤

1. 确保`adb`可以通过WiFi连接手机，这也是要配置ip的原因。
2. 添加设备ip。
3. 添加app的包名。
4. 通过adb从设备上拉取日志文件到本地。
5. 解析堆栈符号地址，只展示设置的排行数量。如果源码文件有效，点击可以跳转到源码，方便查阅。

效果如下：

![Alt text](doc/image.png)