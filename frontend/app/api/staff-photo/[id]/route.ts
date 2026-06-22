// app/api/static/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IMAGE_DIR =
	"/Users/jigmechoden/Desktop/Staff_Attendance_System/attendance_system/src/shared/Image";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	try {
		const { path: pathSegments } = await params;
		const requestedFilename = pathSegments.join("/");
		console.log(`[static] Requested: ${requestedFilename}`);

		// 1. Exact match
		const exactPath = path.join(IMAGE_DIR, requestedFilename);
		if (fs.existsSync(exactPath)) {
			console.log(`[static] Exact match: ${exactPath}`);
			return serveFile(exactPath);
		}

		// 2. Try removing extension and add common extensions
		const baseName = path.basename(
			requestedFilename,
			path.extname(requestedFilename),
		);
		const basePath = path.join(IMAGE_DIR, baseName);
		const extensions = [".png", ".webp", ".jpg", ".jpeg"];
		for (const ext of extensions) {
			const altPath = basePath + ext;
			if (fs.existsSync(altPath)) {
				console.log(`[static] Found alternative extension: ${altPath}`);
				return serveFile(altPath);
			}
		}

		// 3. Search by numeric part (e.g., CID number)
		const numericMatch = requestedFilename.match(/\d+/);
		if (numericMatch) {
			const numeric = numericMatch[0];
			const files = fs.readdirSync(IMAGE_DIR);
			const found = files.find(
				(f) => f.includes(numeric) && /\.(png|webp|jpg|jpeg)$/i.test(f),
			);
			if (found) {
				const foundPath = path.join(IMAGE_DIR, found);
				console.log(`[static] Found by numeric search: ${foundPath}`);
				return serveFile(foundPath);
			}
		}

		console.error(`[static] File not found: ${requestedFilename}`);
		return new NextResponse(`File not found: ${requestedFilename}`, {
			status: 404,
		});
	} catch (err: any) {
		console.error("[static] Error:", err);
		return new NextResponse(`Internal Server Error: ${err.message}`, {
			status: 500,
		});
	}
}

function serveFile(filePath: string) {
	const buffer = fs.readFileSync(filePath);
	const ext = path.extname(filePath).toLowerCase();
	let contentType = "image/jpeg";
	if (ext === ".png") contentType = "image/png";
	else if (ext === ".webp") contentType = "image/webp";
	return new NextResponse(buffer, {
		status: 200,
		headers: { "Content-Type": contentType },
	});
}
