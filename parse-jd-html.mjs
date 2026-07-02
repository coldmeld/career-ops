#!/usr/bin/env node
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const html = readFileSync('/tmp/jd-html.txt', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

// Extract text content from common job posting elements
const textContent = doc.body.innerText || doc.body.textContent || '';

// Print the extracted text (cleaned up)
console.log(textContent);
