import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";

const sanitizeUsuario = <T extends { password?: unknown }>(usuario: T) => {
  const { password: _password, ...safeUsuario } = usuario;
  void _password;
  return safeUsuario;
};

export async function GET() {
  const usuarios = await prisma.usuarios.findMany({
    orderBy: { usuario_id: "asc" },
  });

  return NextResponse.json(usuarios.map(sanitizeUsuario));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { correo, password, nombre_usuario, activo } = body ?? {};

    if (!correo || !password || !nombre_usuario) {
      return NextResponse.json(
        { message: "Los campos correo, password y nombre_usuario son obligatorios." },
        { status: 400 }
      );
    }

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        correo,
        password,
        nombre_usuario,
        activo: typeof activo === "boolean" ? activo : undefined,
      },
    });

    return NextResponse.json(sanitizeUsuario(nuevoUsuario), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "El correo o nombre de usuario ya se encuentra registrado." },
        { status: 409 }
      );
    }

    console.error("Error al crear usuario", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
