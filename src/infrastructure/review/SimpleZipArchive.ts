import { deflateRawSync, inflateRawSync } from "zlib";

type ZipEntry = {
	filename: string;
	data: Buffer;
};

type CentralDirectoryEntry = {
	filename: string;
	compressionMethod: number;
	compressedSize: number;
	uncompressedSize: number;
	localHeaderOffset: number;
};

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

export class SimpleZipArchive {
	constructor(private readonly entries: ZipEntry[]) {}

	static fromArrayBuffer(value: ArrayBuffer): SimpleZipArchive {
		const buffer = Buffer.from(value);
		const centralDirectoryOffset = findCentralDirectoryOffset(buffer);
		const entries = readCentralDirectory(buffer, centralDirectoryOffset)
			.map((entry) => readEntry(buffer, entry));
		return new SimpleZipArchive(entries);
	}

	replace(filename: string, data: Buffer): SimpleZipArchive {
		return new SimpleZipArchive(
			this.entries.map((entry) =>
				entry.filename === filename ? { ...entry, data } : entry,
			),
		);
	}

	has(filename: string): boolean {
		return this.entries.some((entry) => entry.filename === filename);
	}

	read(filename: string): Buffer {
		const entry = this.entries.find((candidate) => candidate.filename === filename);
		if (!entry) {
			throw new Error(`Zip entry not found: ${filename}`);
		}
		return entry.data;
	}

	toArrayBuffer(): ArrayBuffer {
		const fileRecords: Buffer[] = [];
		const centralRecords: Buffer[] = [];
		let offset = 0;

		for (const entry of this.entries) {
			const compressed = deflateRawSync(entry.data);
			const crc = crc32(entry.data);
			const filename = Buffer.from(entry.filename, "utf8");
			const localHeader = Buffer.alloc(30);
			localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
			localHeader.writeUInt16LE(20, 4);
			localHeader.writeUInt16LE(0x0800, 6);
			localHeader.writeUInt16LE(8, 8);
			localHeader.writeUInt32LE(0, 10);
			localHeader.writeUInt32LE(crc, 14);
			localHeader.writeUInt32LE(compressed.length, 18);
			localHeader.writeUInt32LE(entry.data.length, 22);
			localHeader.writeUInt16LE(filename.length, 26);
			localHeader.writeUInt16LE(0, 28);

			fileRecords.push(localHeader, filename, compressed);

			const centralHeader = Buffer.alloc(46);
			centralHeader.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
			centralHeader.writeUInt16LE(20, 4);
			centralHeader.writeUInt16LE(20, 6);
			centralHeader.writeUInt16LE(0x0800, 8);
			centralHeader.writeUInt16LE(8, 10);
			centralHeader.writeUInt32LE(0, 12);
			centralHeader.writeUInt32LE(crc, 16);
			centralHeader.writeUInt32LE(compressed.length, 20);
			centralHeader.writeUInt32LE(entry.data.length, 24);
			centralHeader.writeUInt16LE(filename.length, 28);
			centralHeader.writeUInt16LE(0, 30);
			centralHeader.writeUInt16LE(0, 32);
			centralHeader.writeUInt16LE(0, 34);
			centralHeader.writeUInt16LE(0, 36);
			centralHeader.writeUInt32LE(0, 38);
			centralHeader.writeUInt32LE(offset, 42);
			centralRecords.push(centralHeader, filename);

			offset += localHeader.length + filename.length + compressed.length;
		}

		const centralDirectoryOffset = offset;
		const centralDirectory = Buffer.concat(centralRecords);
		const endRecord = Buffer.alloc(22);
		endRecord.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
		endRecord.writeUInt16LE(0, 4);
		endRecord.writeUInt16LE(0, 6);
		endRecord.writeUInt16LE(this.entries.length, 8);
		endRecord.writeUInt16LE(this.entries.length, 10);
		endRecord.writeUInt32LE(centralDirectory.length, 12);
		endRecord.writeUInt32LE(centralDirectoryOffset, 16);
		endRecord.writeUInt16LE(0, 20);

		const output = Buffer.concat([...fileRecords, centralDirectory, endRecord]);
		return output.buffer.slice(
			output.byteOffset,
			output.byteOffset + output.byteLength,
		);
	}
}

function findCentralDirectoryOffset(buffer: Buffer): number {
	for (let index = buffer.length - 22; index >= 0; index -= 1) {
		if (buffer.readUInt32LE(index) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
			return buffer.readUInt32LE(index + 16);
		}
	}
	throw new Error("Invalid zip archive: end of central directory not found");
}

function readCentralDirectory(
	buffer: Buffer,
	offset: number,
): CentralDirectoryEntry[] {
	const entries: CentralDirectoryEntry[] = [];
	let cursor = offset;

	while (cursor < buffer.length) {
		if (buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_SIGNATURE) {
			break;
		}

		const compressionMethod = buffer.readUInt16LE(cursor + 10);
		const compressedSize = buffer.readUInt32LE(cursor + 20);
		const uncompressedSize = buffer.readUInt32LE(cursor + 24);
		const fileNameLength = buffer.readUInt16LE(cursor + 28);
		const extraLength = buffer.readUInt16LE(cursor + 30);
		const commentLength = buffer.readUInt16LE(cursor + 32);
		const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
		const filename = buffer
			.subarray(cursor + 46, cursor + 46 + fileNameLength)
			.toString("utf8");

		entries.push({
			filename,
			compressionMethod,
			compressedSize,
			uncompressedSize,
			localHeaderOffset,
		});

		cursor += 46 + fileNameLength + extraLength + commentLength;
	}

	return entries;
}

function readEntry(buffer: Buffer, entry: CentralDirectoryEntry): ZipEntry {
	const cursor = entry.localHeaderOffset;
	if (buffer.readUInt32LE(cursor) !== LOCAL_FILE_HEADER_SIGNATURE) {
		throw new Error(`Invalid zip archive: local header not found for ${entry.filename}`);
	}

	const fileNameLength = buffer.readUInt16LE(cursor + 26);
	const extraLength = buffer.readUInt16LE(cursor + 28);
	const dataStart = cursor + 30 + fileNameLength + extraLength;
	const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);
	const data = entry.compressionMethod === 0
		? Buffer.from(compressed)
		: entry.compressionMethod === 8
			? inflateRawSync(compressed)
			: null;

	if (!data) {
		throw new Error(
			`Unsupported zip compression method ${entry.compressionMethod} for ${entry.filename}`,
		);
	}
	if (data.length !== entry.uncompressedSize) {
		throw new Error(`Invalid zip archive: size mismatch for ${entry.filename}`);
	}

	return {
		filename: entry.filename,
		data,
	};
}

function crc32(buffer: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of buffer) {
		crc = (crc >>> 8) ^ (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, tableIndex) => {
	let value = tableIndex;
	for (let bit = 0; bit < 8; bit += 1) {
		value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	}
	return value >>> 0;
});
