cmake_minimum_required(VERSION 3.4.1)
add_library( # Sets the name of the library.
             wsc

             # Sets the library as a shared library.
             SHARED

             # Provides a relative path to your source file(s).
             src/main/jni/wsc.c)

find_library(
              log-lib
              log )


target_link_libraries(
                       wsc
                       ${log-lib} )