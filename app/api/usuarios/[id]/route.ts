import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";

const sanitizeUsuario = <T extends { password?: unknown }>(usuario: T) => {
  const { password: _password, ...safeUsuario } = usuario;
  void _password;
  return safeUsuario;
};

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuarioId = parseId(params.id);

  if (usuarioId === null) {
    return NextResponse.json({ message: "Identificador inválido." }, { status: 400 });
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { usuario_id: usuarioId },
  });

  if (!usuario) {
    return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json(sanitizeUsuario(usuario));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateUsuario(request, params, false);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateUsuario(request, params, true);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuarioId = parseId(params.id);

  if (usuarioId === null) {
    return NextResponse.json({ message: "Identificador inválido." }, { status: 400 });
  }

  try {
    await prisma.usuarios.delete({
      where: { usuario_id: usuarioId },
    });

    return NextResponse.json({ message: "Usuario eliminado correctamente." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
    }

    console.error("Error al eliminar usuario", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}

async function updateUsuario(
  request: NextRequest,
  params: { id: string },
  isPartial: boolean
) {
  const usuarioId = parseId(params.id);

  if (usuarioId === null) {
    return NextResponse.json({ message: "Identificador inválido." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { correo, password, nombre_usuario, activo } = body ?? {};

    if (!isPartial && (!correo || !password || !nombre_usuario)) {
      return NextResponse.json(
        { message: "Los campos correo, password y nombre_usuario son obligatorios." },
        { status: 400 }
      );
    }

    const data: Prisma.usuariosUpdateInput = {};

    if (correo !== undefined) data.correo = correo;
    if (password !== undefined) data.password = password;
    if (nombre_usuario !== undefined) data.nombre_usuario = nombre_usuario;
    if (activo !== undefined) data.activo = activo;

    const usuarioActualizado = await prisma.usuarios.update({
      where: { usuario_id: usuarioId },
      data,
    });

    return NextResponse.json(sanitizeUsuario(usuarioActualizado));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
      }

      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "El correo o nombre de usuario ya se encuentra registrado." },
          { status: 409 }
        );
      }
    }

    console.error("Error al actualizar usuario", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
