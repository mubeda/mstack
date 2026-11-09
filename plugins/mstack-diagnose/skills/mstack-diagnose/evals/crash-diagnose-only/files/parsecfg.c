#include <stdio.h>
#include <string.h>
#include <stdlib.h>
/* Reads key=value lines and prints them. */
static void handle_line(char *line) {
    char *eq = strchr(line, '=');
    *eq = '\0';
    printf("%s -> %s", line, eq + 1);
}
int main(int argc, char **argv) {
    if (argc < 2) { fprintf(stderr, "usage: parsecfg FILE\n"); return 2; }
    FILE *f = fopen(argv[1], "r");
    if (!f) { perror("fopen"); return 1; }
    char buf[256];
    while (fgets(buf, sizeof buf, f)) {
        if (buf[0] == '#' || buf[0] == '\n') continue;
        handle_line(buf);
    }
    fclose(f);
    return 0;
}
