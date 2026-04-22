 "use client"

import type { ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { isAdmin } from "@/lib/auth"
import { createBrowserClient as createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"

const facilityOptions = [
  "Laboratorium Hidroponik",
  "Greenhouse",
  "Kebun Organik",
  "Laboratorium Bioteknologi",
  "Ruang Seminar",
  "Area Penelitian",
] as const

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"

type ReservationForm = {
  namaLengkap: string
  instansi: string
  email: string
  nomorTelepon: string
  tanggalKunjungan: string
  sesiKunjungan: "pagi" | "siang" | ""
}

const initialForm: ReservationForm = {
  namaLengkap: "",
  instansi: "",
  email: "",
  nomorTelepon: "",
  tanggalKunjungan: "",
  sesiKunjungan: "",
}

export default function ReservasiPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase =
    supabaseUrl && supabaseAnonKey
      ? createClientComponentClient(supabaseUrl, supabaseAnonKey)
      : null
  const [form, setForm] = useState<ReservationForm>(initialForm)
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)

  const handleChange =
    (field: keyof ReservationForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleFacilityToggle = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((item) => item !== facility) : [...prev, facility]
    )
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setUploadedFile(file)
  }

  const handleCancel = () => {
    setForm(initialForm)
    setSelectedFacilities([])
    setUploadedFile(null)
    setSubmitError(null)
  }

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  setSubmitError(null)
  setIsSubmitting(true)

  if (!supabase) {
    setSubmitError("Supabase environment belum terkonfigurasi.")
    setIsSubmitting(false)
    return
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("SESSION:", session)

  // 🔥 FIX 1: SIMPAN DATA FORM + REDIRECT
  if (!session) {
    setIsSubmitting(false)

    localStorage.setItem("redirectAfterLogin", "/reservasi")
    localStorage.setItem("formData", JSON.stringify({
      form,
      selectedFacilities
    }))

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // ✅ FIX
      },
    })

    return
  }

  // 🔥 LANJUT SUBMIT NORMAL
  let dokumenUrl: string | null = null

  if (uploadedFile) {
    const sanitizedName = uploadedFile.name.replace(/\s+/g, "-")
    const filePath = `${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase
      .storage
      .from("dokumen")
      .upload(filePath, uploadedFile)

    if (uploadError) {
      setSubmitError(uploadError.message)
      setIsSubmitting(false)
      return
    }

    const { data } = supabase.storage.from("dokumen").getPublicUrl(filePath)
    dokumenUrl = data.publicUrl
  }

  const sesiMap: Record<string, "Pagi" | "Siang"> = {
    pagi: "Pagi",
    siang: "Siang",
  }

  const payload = {
    nama_lengkap: form.namaLengkap,
    email: form.email,
    nomor_telepon: form.nomorTelepon,
    tanggal_kunjungan: form.tanggalKunjungan,
    sesi_kunjungan: sesiMap[form.sesiKunjungan],
    fasilitas: selectedFacilities,
    status: "pending",
    dokumen_url: dokumenUrl,
  }

  const { error } = await supabase.from("reservasi").insert(payload)

  if (error) {
    setSubmitError(error.message)
    setIsSubmitting(false)
    return
  }

  alert("Reservasi berhasil dikirim.")

  localStorage.removeItem("formData")

  setForm(initialForm)
  setSelectedFacilities([])
  setUploadedFile(null)
  setIsSubmitting(false)
}

  useEffect(() => {
    if (!supabase) return

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const email = user?.email ?? null
      setUserEmail(email)
      setIsAdminUser(email ? isAdmin(email) : false)
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      const email = session?.user.email ?? null
      setUserEmail(email)
      setIsAdminUser(email ? isAdmin(email) : false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-blue-800 bg-blue-900 text-white shadow-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight">ATP IPB University</p>
            <p className="text-xs text-blue-100 sm:text-sm">
              Agribusiness and Technology Park
            </p>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-800 sm:px-4 sm:py-2"
            >
              Kembali ke Beranda
            </Link>

            {userEmail ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-blue-100 sm:inline">{userEmail}</span>
                  {isAdminUser ? (
                    <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-900">
                      Admin
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-800 sm:px-4 sm:py-2"
                >
                  Logout
                </button>
              </>
            ) : null}
          </nav>
        </div>
        <p className="mx-auto w-full max-w-6xl px-4 pb-3 text-xs text-blue-100 sm:px-6">
          Halaman Reservasi
        </p>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900 sm:text-4xl">
            Reservasi Kunjungan ATP IPB
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Silakan isi form berikut untuk melakukan reservasi kunjungan.
          </p>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-amber-400" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7 lg:col-span-2">
            <form className="grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="nama_lengkap"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nama Lengkap
                </label>
                <input
                  id="nama_lengkap"
                  name="nama_lengkap"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className={inputClassName}
                  value={form.namaLengkap}
                  onChange={handleChange("namaLengkap")}
                />
              </div>

              <div>
                <label
                  htmlFor="instansi"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nama Instansi / Organisasi
                </label>
                <input
                  id="instansi"
                  name="instansi"
                  type="text"
                  placeholder="Masukkan nama instansi"
                  className={inputClassName}
                  value={form.instansi}
                  onChange={handleChange("instansi")}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  className={inputClassName}
                  value={form.email}
                  onChange={handleChange("email")}
                />
              </div>

              <div>
                <label
                  htmlFor="nomor_telepon"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nomor Telepon
                </label>
                <input
                  id="nomor_telepon"
                  name="nomor_telepon"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className={inputClassName}
                  value={form.nomorTelepon}
                  onChange={handleChange("nomorTelepon")}
                />
              </div>

              <div>
                <label
                  htmlFor="tanggal_kunjungan"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Tanggal Kunjungan
                </label>
                <input
                  id="tanggal_kunjungan"
                  name="tanggal_kunjungan"
                  type="date"
                  className={inputClassName}
                  value={form.tanggalKunjungan}
                  onChange={handleChange("tanggalKunjungan")}
                />
              </div>

              <div>
                <label
                  htmlFor="sesi_kunjungan"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Sesi Kunjungan
                </label>
                <select
                  id="sesi_kunjungan"
                  name="sesi_kunjungan"
                  className={inputClassName}
                  value={form.sesiKunjungan}
                  onChange={handleChange("sesiKunjungan")}
                >
                  <option value="">Pilih sesi kunjungan</option>
                  <option value="pagi">Pagi (08:00 - 12:00)</option>
                  <option value="siang">Siang (13:00 - 16:00)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Pilih Fasilitas yang Ingin Dikunjungi
                </p>
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {facilityOptions.map((facility) => (
                    <label
                      key={facility}
                      htmlFor={facility}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-blue-300"
                    >
                      <input
                        id={facility}
                        type="checkbox"
                        checked={selectedFacilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-400"
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="dokumen"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Upload Dokumen (Opsional)
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label
                      htmlFor="dokumen"
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
                    >
                      Choose File
                    </label>
                    <input
                      id="dokumen"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    <p className="text-sm text-slate-600">
                      {uploadedFile ? uploadedFile.name : "No file chosen"}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">PDF, DOC, DOCX (Maks. 5MB)</p>
              </div>

              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Reservasi"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Batal
                </button>
              </div>

              {submitError ? (
                <p className="sm:col-span-2 text-sm text-red-600">
                  Gagal mengirim reservasi: {submitError}
                </p>
              ) : null}
            </form>
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <h2 className="text-xl font-semibold text-blue-900">Informasi Kontak</h2>

            <div className="mt-5 space-y-5 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-800">Alamat</p>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Jl. Raya Dramaga, Kampus IPB Dramaga, Bogor 16680, Jawa Barat
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Telepon</p>
                <p className="mt-1 text-slate-600">(0251) 8628448</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Email</p>
                <p className="mt-1 text-slate-600">atp@ipb.ac.id</p>
              </div>
            </div>

            <div className="my-6 h-px bg-slate-200" />

            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-800">Jam Operasional</p>
              <p className="mt-1 text-sm text-slate-600">Senin - Jumat</p>
              <p className="text-sm text-slate-600">08:00 - 16:00</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
