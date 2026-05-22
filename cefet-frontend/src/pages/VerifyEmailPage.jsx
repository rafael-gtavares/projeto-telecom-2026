import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function VerifyEmailPage() {

    const hasVerified = useRef(false)

    const { token } = useParams()

    useEffect(() => {

        if (hasVerified.current) return

        hasVerified.current = true

        const verifyEmail = async () => {

            try {

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`
                )

                const {
                    accessToken,
                    refreshToken,
                    user
                } = response.data.data

                localStorage.setItem(
                    'accessToken',
                    accessToken
                )

                localStorage.setItem(
                    'refreshToken',
                    refreshToken
                )

                localStorage.setItem(
                    'user',
                    JSON.stringify(user)
                )

                window.location.href = '/'

            } catch (err) {

                console.log(err)

                window.location.href = '/login'
            }
        }

        verifyEmail()

    }, [token])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl font-bold">
                Verificando email...
            </h1>
        </div>
    )
}