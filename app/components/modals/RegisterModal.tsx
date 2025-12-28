"use client";
import axios from "axios";
import { AiFillGithub } from "react-icons/ai";
import { FcGoogle} from "react-icons/fc";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { FieldValues, SubmitHandler } from "react-hook-form";

import useRegisterModal from "@/app/hooks/useRegisterModal";
import useLoginModal from "@/app/hooks/useLoginModal";

import Modal from "./Modal";
import Heading from "../Heading";
import FormInput from "../inputs/FormInput";
import toast from "react-hot-toast";
import FormButton from "../FormButton";
import { signIn } from "next-auth/react";

const RegisterModal = () => {
    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();

    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {
            errors,
        }
    } = useForm<FieldValues>({
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        setIsLoading(true);

        axios.post('/api/register', data)
        .then(() => {
            toast.success('Success!');
            registerModal.onClose();
            loginModal.onOpen();
        })
        .catch((error) => {
            toast.error("Something went wrong!");
            console.log(error);
        })
        .finally(() => {
            setIsLoading(false);
        })
    }

    const toggle = useCallback(() => {
        registerModal.onClose();
        loginModal.onOpen();
    }, [loginModal,registerModal]);

    const bodyContent = (
        <div className="flex flex-col gap-4">
            <Heading title="Welcome to CanvasDB" subtitle="Create an account!" />
            <FormInput id="email" label="Email" disabled={isLoading} register={register} errors={errors} required/>
            <FormInput id="name" label="Name" disabled={isLoading} register={register} errors={errors} required/>
            <FormInput id="password" type="password" label="Password" disabled={isLoading} register={register} errors={errors} required/>
        </div>
    )

    const footerContent = (
        <div className="flex flex-col gap-4 mt-3">
            <hr className="border-neutral-200" />
            <FormButton outline label="Continue with Google" icon={FcGoogle} onClick={() => signIn('google')}/>
            <FormButton outline label="Continue with Github" icon={AiFillGithub} onClick={() => signIn('github')}/>
            <div className="text-neutral-500 text-center mt-4 font-light">
                <div className="justify-center flex flex-row items-center gap-2">
                    <div>
                        Already have an account?
                    </div>
                    <div onClick={toggle} className="text-neutral-800 cursor-pointer hover:underline">
                        Login
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <Modal disabled={isLoading} isOpen={registerModal.isOpen} title="Register" actionLabel="Continue" onClose={registerModal.onClose} onSubmit={handleSubmit(onSubmit)} body={bodyContent} footer={footerContent}/>
    );
}

export default RegisterModal;