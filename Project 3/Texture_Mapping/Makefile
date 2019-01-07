
NAME		=	runnable

DIRECTORY	=	Texture_Mapping

ARCHIVE		=	tar -cvzf

CC		=	gcc

ECHO	=	@echo

RM	=	rm -f

SRC	=	Aditya_Teapot.c

CFLAGS		=	-Wall			\
			-W			\
			-Wstrict-prototypes	\
			-Werror

IFLAGS		=	-I/usr/include		\
			-I/usr/include/GL	\
			-I/usr/X11R6/include	\
			-I/usr/X11R6/include/GL

LFLAGS		=	-L/usr/lib		\
			-L/usr/X11R6/lib	\
			-lX11			\
			-lGL			\
			-lGLU			\
			-lglut			\
			-ljpeg

OBJ		=	$(SRC:.c=.o)

all :		$(NAME)

$(NAME) :	$(OBJ)
		$(CC) $(OBJ) $(LFLAGS) -o $(NAME)

.c.o :
		$(CC) $(CFLAGS) $(IFLAGS) $< -c -o $@

clean :
		$(RM) $(OBJ)
		$(RM) *~ \#*\#

distclean :	clean
		$(RM) $(NAME)

separator :
		$(ECHO) "------------------------------------------"

re :	clean separator all

run :	all
		./$(NAME)

tarball :	distclean separator
		$(ECHO) "Archiving..."
		cd .. && $(ARCHIVE) $(NAME).tar.gz $(DIRECTORY)
		$(ECHO) "Done !"

install : $(ECHO) 
	"Not implemented yet."

love : $(ECHO) 
	"Nothing to show.."
