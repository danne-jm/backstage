FROM alpine
RUN cat <<'EOF' > /etc/test.conf
hello
world
EOF
RUN cat /etc/test.conf
