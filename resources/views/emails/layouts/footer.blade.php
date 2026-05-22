                    </div>
                    <div class="footer">
                        <div class="footer-brand">Philobooth · Photo Stories</div>
                        <p>
                            Email ini dikirim otomatis dari sistem philobooth.
                            Pertanyaan? Balas email ini atau kontak
                            <a href="mailto:hello@philobooth.id">hello@philobooth.id</a>.
                        </p>
                        <hr class="divider" />
                        <p style="font-size: 11px; color: #A3A3A3;">
                            © {{ date('Y') }} Philobooth. Cetak momen, bukan cuma foto.
                            <br>
                            <a href="{{ config('app.url') }}">{{ str_replace(['http://', 'https://'], '', config('app.url')) }}</a>
                        </p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
