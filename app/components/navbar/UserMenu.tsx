"use client";

import { AiOutlineMenu } from "react-icons/ai";
import Avatar from "../Avatar";
import { useCallback, useState } from "react";
import MenuItem from "./MenuItem";

import useRegisterModal from "@/app/hooks/useRegisterModal";
import useLoginModal from "@/app/hooks/useLoginModal";

import { signOut } from "next-auth/react";
import { SafeUser } from "@/app/types";

import { useRouter } from "next/navigation";

interface UserMenuProps {
    currentUser?: SafeUser | null;
}

const UserMenu: React.FC<UserMenuProps> = ({
    currentUser
}) => {
    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const toggleOpen = useCallback(() => {
        setIsOpen((value) => !value);
    }, [])

    return (
        <div className="relative">
            <div className="flex flex-row items-center gap-3">
                <div onClick={toggleOpen} className="p-3 md:py-1 md:px-2 border border-neutral-200 flex flex-row items-center gap-3 rounded-full cursor-pointer hover:shadow-md transition dark:border-neutral-800">
                    <AiOutlineMenu />
                    <div className="hidden md:block">
                        <Avatar src={currentUser?.image}/>
                    </div>
                </div>
            </div>
            {isOpen && (
                <div className="absolute rounded-xl shadow-md w-32 bg-white overflow-hidden right-0 top-12 text-sm dark:bg-black">
                    <div className="flex flex-col cursor-pointer">
                        {currentUser ?  (
                        <>
                            <MenuItem 
                                onClick={() => signOut()} 
                                label="Log Out"
                            />
                        </>
                        ) : ( 
                        <>
                            <MenuItem 
                                onClick={loginModal.onOpen} 
                                label="Login"
                            />
                            <MenuItem 
                                onClick={registerModal.onOpen} 
                                label="Sign Up"
                            />
                        </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserMenu;