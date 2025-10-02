import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sanitizeUsuario = <T extends { password?: unknown }>(usuario: T) => {
  const { password: _password, ...safeUsuario } = usuario;
  void _password;
  return safeUsuario;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre_usuario, password } = body ?? {};

    if (!nombre_usuario || !password) {
      return NextResponse.json(
        { message: "Los campos nombre_usuario y password son obligatorios." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { nombre_usuario },
    });

    if (!usuario || !usuario.activo || usuario.password !== password) {
      return NextResponse.json(
        { message: "Credenciales inválidas o usuario inactivo." },
        { status: 401 }
      );
    }

    return NextResponse.json(sanitizeUsuario(usuario));
  } catch (error) {
    console.error("Error al iniciar sesión", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
